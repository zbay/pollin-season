function routers(app){
	
var signInOrOut = require("./signInOrOut.js"); signInOrOut(app);
var home = require("./home.js"); home(app);
var signup = require("./signup.js"); signup(app);
var settings = require("./settings.js"); settings(app);
var bcrypt = require('bcrypt');
var async = require('async');
var mongoose = require('mongoose');
var requireLogin = require(process.cwd() + "/controlHelpers/requireLogin.js");
var User = require(process.cwd() + "/dbmodels/user.js"); User = mongoose.model("User");
var Poll = require(process.cwd() + "/dbmodels/poll.js"); Poll = mongoose.model("Poll");
var Shared = require(process.cwd() + "/dbmodels/shared.js"); Shared = mongoose.model("Shared");

app.get("/newPoll", requireLogin, function(req, res){
		req.session.successMessage = null;
		req.session.errorMessage = null;
		res.render("newPoll", {seshName: req.session.sessionName});	
});

app.post("/newPoll", requireLogin, function(req, res){ //adding a poll from the user's account
	var pollName = req.body.pollName;
	var options = req.body.options;
	var optionsWithTallies = [];
	var userID;
	if(pollName.length > 1 && options.length > 1){
	async.each(options, appendOption, renderDash);
	}
	else{
		req.session.errorMessage = "You submitted a poll with a title of inadequate length, a title that's already taken, or has an insufficient number of options. Try again.";
		req.session.successMessage = null;
		res.render("newPoll", {seshName: req.session.sessionName, error: req.session.errorMessage});
	}
	
	function appendOption(option, callback){
		if(option.length > 0){
		var appendThis = {"text": option, "votes": []};
		optionsWithTallies.push(appendThis);
		}
		return callback(null);
	}
	function renderDash(){
		if(optionsWithTallies.length > 1){
			var newPoll = new Poll({"userID": req.session.sessionID, "creatorName": req.session.sessionName, "title": pollName, "options": optionsWithTallies});	
   			newPoll.save(function(){
   			req.session.successMessage = "Poll added!";
			res.render("newPoll", {seshName: req.session.sessionName, success: req.session.successMessage});
   			});
		}
		else{
			req.session.errorMessage = "You did not submit enough options containing text! Try again.";
			res.render("newPoll", {seshName: req.session.sessionName, error: req.session.errorMessage});
		}
	}
	});

app.get("/myPolls", requireLogin, function(req, res){
		req.session.successMessage = null;
		req.session.errorMessage = null;
		getMyPollList(req.session, function(){
			res.render("myPolls", {seshName: req.session.sessionName, polls: req.session.myPolls});	
		});
});
app.get("/sharedPolls", requireLogin, function(req, res){
		req.session.successMessage = null;
		req.session.errorMessage = null;
		getSharedPollList(req.session, function(){
			res.render("sharedPolls", {seshName: req.session.sessionName, sharedPolls: req.session.sharedPolls});	
		});
});

app.delete("/myPolls", requireLogin, function(req, res){
			var deleteThis = req.body.deleteID;
			Poll.remove({"_id": deleteThis, "userID": req.session.sessionID}).lean().exec(function(err, data){
			if(err || data.result.n == 0){
				req.session.errorMessage = "Error. This poll has already been deleted.";
				res.json({"error": req.session.errorMessage });
			} //err
			else{
				req.session.successMessage = "Poll removed.";
				req.session.errorMessage = "";
				res.json({ "success": req.session.successMessage  });
			} //!err
		}); //Poll.remove
});

app.get("/polls/:id", requireLogin, function(req, res){
		Poll.findOne({"_id": req.params.id}).lean().exec(function(err, doc) {
		var thePoll = {"_id": doc._id, "pollName": doc.title, "pollOptions": doc.options, "creatorName": doc.creatorName, "userID": doc.userID};
		res.render("poll", {seshName: req.session.sessionName, poll: thePoll, pollID: req.params.id, success:req.session.successMessage, error:req.session.errorMessage});
		});
}); //get poll

app.post("/polls/:id", requireLogin, function(req, res){  //register a vote for a poll's option
var pollID = req.params.id;
if(req.body.action == "castVote"){
		var optionID = req.body.incrementID;
		Poll.update({"_id": pollID, "options._id": optionID}, {$addToSet: {"options.$.votes": req.session.sessionID}}).lean().exec(function(err, doc){
			req.session.errorMessage=null;
			if(doc.nModified == 0){
				req.session.successMessage = "Vote removed!";
				Poll.update({"_id": pollID, "options._id": optionID}, {$pull: {"options.$.votes": req.session.sessionID}}, function(){
					res.redirect("/polls/" + pollID);
				});
			}
			else{
				req.session.successMessage="Vote cast!";
				res.redirect("/polls/" + pollID);
			}
		});
}
else{
    var userURL = req.body.userURL;
    var userID = userURL.slice(userURL.lastIndexOf("/")+1);
    console.log(userID);
    var newShare = new Shared({"sharer": req.session.sessionName, "sharee": userID, "pollID": pollID});
    newShare.save(function(err, data){
        if(err){
            req.session.successMessage = null;
            req.session.errorMessage = "You entered an invalid URL for sharing. Try again.";
        }
        else{
            req.session.successMessage = "Poll successfully shared!";
            req.session.errorMessage = null;
        }
        res.redirect("/polls/" + pollID);
    });
}

}); //post poll

app.get("/otherPolls", requireLogin, function(req, res){
		getCommunityPollList(req.session, function(){
			res.render("otherPolls",  {seshName: req.session.sessionName, polls: req.session.commPolls, error: req.session.errorMessage});	
		});
});

app.get("/editPoll/:id", requireLogin, function(req, res) {
		Poll.findOne({"_id": req.params.id, "userID": req.session.sessionID}).lean().exec(function(err, doc) {
		var thePoll = {"_id": doc._id, "pollName": doc.title, "pollOptions": doc.options};
		res.render("editPoll", {seshName: req.session.sessionName, poll: thePoll, pollID: req.params.id, success:req.session.successMessage, error:req.session.errorMessage});
		});
});

app.post("/editPoll/:id", requireLogin, function(req, res){  //register a vote for a poll's option
		var pollID = req.params.id;
		var pollName = req.body.pollName;
		var options = req.body.options;
		var optionsWithTallies = [];
		
		async.each(options, appendOption, renderDash);
	
	function appendOption(option, callback){
		if(option.length > 0){
		var appendThis = {"text": option, "votes": []};
		optionsWithTallies.push(appendThis);
		}
		return callback(null);
	}
	function renderDash(){
			if(pollName.length > 1 && options.length > 1 && optionsWithTallies.length > 1){
				req.session.errorMessage = null;
				req.session.successMessage = "Poll updated!";
				Poll.update({"_id":pollID}, {"title": pollName, "options": optionsWithTallies}, function(){
				res.redirect("editPoll/" + pollID);
				});
			}
   			else{
		req.session.errorMessage = "Error: you submitted a poll with a title of inadequate length, a title that's already taken, or has an insufficient number of options. Try again.";
		req.session.successMessage = null;
		res.redirect("editPoll/" + pollID);
			}
	}
}); //post poll

app.get("/users/:id", requireLogin, function(req, res){
	var userID = req.params.id;
	getUserPollList(req.session, userID, function(){
	    User.findOne({"_id": userID}, function(err, data){
	       res.render("user", {seshName: req.session.sessionName, userPolls:req.session.visitedUserPolls, userName: data.name, success:req.session.successMessage, error: req.session.errorMessage}); 
	    });
	});
});
app.post("/users/:id", requireLogin, function(req, res){
    var userID = req.params.id;
    var pollURL = req.body.pollURL;
    var pollID = pollURL.slice(pollURL.lastIndexOf("/")+1);
    var newShare = new Shared({"sharer": req.session.sessionName, "sharee": userID, "pollID": pollID});
    newShare.save(function(err, data){
        if(err){
            req.session.successMessage = null;
            req.session.errorMessage = "You entered an invalid URL for sharing. Try again.";
        }
        else{
            req.session.successMessage = "Poll successfully shared!";
            req.session.errorMessage = null;
        }
        res.redirect("/users/" + userID);
});
});
app.get("/userList", requireLogin, function(req, res){
		var userList = User.find({}).limit(100).stream();
		var userListRender = [];
		userList.on("data", function(userData){
			userListRender.push({"id": userData._id, "name": userData.name});
		});
		userList.on("end", function(){
			res.render("userList", {userList: userListRender, seshName: req.session.sessionName});
		});
});

app.use(function(req, res) {
	res.status(404).render("404", {seshName: req.session.sessionName});
});
/*app.use(function(error, req, res, next) {
    res.status(500).render("500", {seshName: req.session.sessionName});
});*/

function getMyPollList(session, callback){
		session.myPolls = [];
		var userPolls = Poll.find({"userID": session.sessionID}).stream();
		userPolls.on("data", function(pollData){
			session.myPolls.push({"id": pollData._id, "name": pollData.title});
		});
		userPolls.on("end", function(){
			callback();
		});
}
function getSharedPollList(session, callback){
		session.sharedPolls = [];
		var shared = Shared.find({"sharee": session.sessionID}).stream();
		shared.on("data", function(pollData){
		    Poll.find({"_id": pollData.pollId}, function(err, data){
		        session.sharedPolls.push({"id": data._id, "name": data.title});
		    });
		});
		shared.on("end", function(){
			callback();
		});
}
function getUserPollList(session, userID, callback){
		session.visitedUserPolls = [];
		var userPolls = Poll.find({"userID": userID}).stream();
		userPolls.on("data", function(pollData){
			session.visitedUserPolls.push({"id": pollData._id, "name": pollData.title});
		});
		userPolls.on("end", function(){
			callback();
		});
}
function getCommunityPollList(session, callback){
		session.commPolls = [];
		var userPolls = Poll.find({"userID": {$ne: session.sessionID}}).limit(100).stream();
		userPolls.on("data", function(pollData){
			session.commPolls.push({"id": pollData._id, "name": pollData.title, "userID": pollData.userID, "userName": pollData.creatorName});
		});
		userPolls.on("end", function(){
			callback();
		});
}
}
module.exports = routers;