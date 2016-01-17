module.exports.set = function(app) {
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var async = require('async');
var User = require("../dbmodels/user.js");
var Poll = require("../dbmodels/poll.js");
User = mongoose.model("User");
Poll = mongoose.model("Poll");
var sessionMyPolls = [];
var sessionCommPolls = [];

app.get('/', function(req, res){
	var path = req.path;
	res.locals.path = path;
	if(req.session.sessionID){
		res.redirect("/dashboard");
	}
	else{
		req.session.reset();
		res.render('index', {seshName: req.session.sessionName});	
	}
});

app.get('/login', function(req, res){ //access login page
	if(!req.session.sessionID){
		res.render('login', {seshName: req.session.sessionName, success: req.session.successMessage});
	}
	else{
		res.redirect("/dashboard");
	}
});

app.post('/login', function(req, res){ //attempt to log in with email/password
  var email = req.body.email;
  var password = req.body.password;
  User.findOne({"email": email}, function(err, doc){
  	if(!err && doc != null){
  		var hashedPassword = doc.password;
  		if(bcrypt.compareSync(password, hashedPassword)){
  			req.session.sessionEmail = email;
  			req.session.sessionName = doc.name;
  			req.session.sessionID = doc._id;
  		res.redirect("/dashboard");
  		}
  		else{
    	req.session.errorMessage = "Error: incorrect email or password. Try again.";
    	req.session.successMessage = null;
    	res.render("login", {seshName: req.session.sessionName, error: req.session.errorMessage});
    }
  	}
    else{
    	req.session.errorMessage = "Error: incorrect email or password. Try again.";
    	res.render("login", {seshName: req.session.sessionName, error: req.session.errorMessage});
    }
  });
});

app.get('/logout', function(req, res){ //sign out
	req.session.reset();
	res.redirect("/");
});

app.get("/signup", function(req, res){
	if(!req.session.sessionID){
		res.render('signup', {});
	}
	else{
		req.session.successMessage = null;
		req.sessionerrorMessage = null;
		res.redirect("/dashboard");
	}
});

app.post('/signup', function(req, res){ //submit new account info
	if(req.session.sessionID){
		res.redirect("/dashboard");
	}
else{
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var hashedPassword = bcrypt.hashSync(password, 10);
  var emailRegex = /@/;
  
  if(name && email && password && name.length > 2 && email.match(emailRegex) && password.length > 6){
   var newUser = new User({"name": name, "email":email, "password": hashedPassword}); 
   newUser.save(function(){
   User.findOne({"email": email}).lean().exec(function(err, data){
   if(!err){
   req.session.successMessage = "Account successfully created!";
   req.session.errorMessage = null;
   res.redirect("/login");
   	}
   });
   });

  }
  else{
  	req.session.errorMessage = "Error: invalid information. Enter a valid email, a name longer than 2 characters, and a password longer than 6 characters.";
  	req.session.successMessage = null;
  	res.render('signup', {seshName: req.session.sessionName, error: req.session.errorMessage});
  }
}

});

app.get("/settings", function(req, res){
	if(!req.session.sessionID){
		req.session.reset();
		res.redirect("/");
	}
	else{
		req.session.successMessage = null;
		req.session.errorMessage = null;
		res.render("settings", {seshName: req.session.sessionName, seshEmail: req.session.sessionEmail});
	}
});

app.post("/settings", function(req, res){ //submit changes to account info
    if(!req.session.sessionID){
    	req.session.reset();
		res.redirect("/");
	}
	else{
		var newName = req.body.name;
		var newEmail = req.body.email;
		var currentPassword = req.body.currentPassword;
		var newPassword = req.body.newPassword;
		
		User.findOne({"email": req.session.sessionEmail}).lean().exec(function(err, doc){
			var hashedPassword = doc.password;
  	if(doc && !err && newPassword.length > 6 && bcrypt.compareSync(currentPassword, hashedPassword)){
  		var userID = doc._id;
  		User.update({"_id": req.session.sessionID}, {"$set": {"password": bcrypt.hashSync(newPassword, 10), "name": newName, "email": newEmail}}, function(err, data){
  			if(!err){
  					req.session.sessionEmail = newEmail;
  					req.session.sessionName = newName;
  					req.session.successMessage = "Info successfully changed!";
  					req.session.errorMessage = null;
  					res.render("settings", {seshName: req.session.sessionName, seshEmail: req.session.sessionEmail, success: req.session.successMessage});
  			}
  			else{
  				req.session.errorMessage = "Error. That email address is associated with another account. Use a different one.";
  				req.session.successMessage = null;
  				res.render("settings", {seshName: req.session.sessionName, seshEmail: req.session.sessionEmail, error: req.session.errorMessage});
  			}
  		});
  	}
    else{
    	req.session.errorMessage = "Error: unsuccessful password change. Make sure you entered your old one correctly, and that the new one is at least 7 characters in length.";
    	req.session.successMessage = null;
    	res.render("settings", {seshName: req.session.sessionName, seshEmail: req.session.sessionEmail, error: req.session.errorMessage});
    }
  });
	}
});

app.get("/dashboard", function(req, res){
	if(!req.session.sessionID){
		req.session.reset();
		res.redirect("/");
	} //if not logged in
	else{
		req.session.successMessage = null;
		req.session.errorMessage = null;
		getMyPollList(req.session, function(){
			res.render("dashboard", {seshName: req.session.sessionName, polls: sessionMyPolls});	
		});
	} //else if not logged in
});

app.post("/dashboard", function(req, res){ //adding or deleting a poll from the user's account
	    if(!req.session.sessionID){
		res.redirect("/");
	} //if logged in
	else{
	var pollName = req.body.pollName;
	var options = req.body.options;
	var optionsWithTallies = [];
	var userID;
	async.each(options, appendOption, renderDash);
	
	function appendOption(option, callback){
		var appendThis = {"text": option, "votes": []};
		optionsWithTallies.push(appendThis);
		return callback(null);
	}
	function renderDash(){
		if(pollName.length > 1 && options.length > 1){
   			var newPoll = new Poll({"userID": req.session.sessionID, "creatorName": req.session.sessionName, "title": pollName, "options": optionsWithTallies});	
   			newPoll.save(function(){
   			  		getMyPollList(req.session, function(){
   			  			req.session.successMessage = "Poll added!";
			res.render("dashboard", {seshName: req.session.sessionName, polls: sessionMyPolls, success: req.session.successMessage});
		}); // if no error
   			});
			}
   			else{
		req.session.errorMessage = "Error: you submitted a poll with a title of inadequate length, a title that's already taken, or has an insufficient number of options. Try again.";
		req.sessoin.successMessage = "";
		getMyPollList(req.session, function(){
			res.render("dashboardAJAX", {seshName: req.session.sessionName, polls: sessionMyPolls, error: req.session.errorMessage});
		});
			}
	}
	}
	});
app.delete("/dashboard", function(req, res){
			var deleteThis = req.body.deleteID;
			sessionMyPolls = [];
			Poll.remove({"_id": deleteThis, "userID": req.session.sessionID}).lean().exec(function(err, data){

			if(err || data.result.n == 0){
				req.session.errorMessage = "Error. You're not allowed to delete that poll because you did not create it! Sorry.";
				res.send({"error": req.session.errorMessage });
			} //err
			else{
				req.session.successMessage = "Poll removed.";
				req.session.errorMessage = "";
				res.json({ "success": req.session.successMessage  });
			} //!err
		}); //Poll.remove
});

app.get("/polls/:id", function(req, res){
	if(!req.session.sessionID){
		req.session.reset();
		res.redirect("/");
	}
	else{
		Poll.findOne({"_id": req.params.id}).lean().exec(function(err, doc) {
		var thePoll = {"_id": doc._id, "pollName": doc.title, "pollOptions": doc.options, "creatorName": doc.creatorName};
		res.render("poll", {seshName: req.session.sessionName, poll: thePoll, pollID: req.params.id, success:req.session.successMessage});
		});
	}
}); //get poll

app.post("/polls/:id", function(req, res){  //register a vote for a poll's option
	if(!req.session.sessionID){
		req.session.reset();
		res.redirect("/");
	}
	else{
		var pollID = req.params.id;
		var optionID = req.body.incrementID;
	/*	Poll.findOne({"_id": pollID, "options._id": optionID, sessionID: {$in: "options.$.votes"}}).lean().exec(function(err, doc){
			console.log(err);
		});*/
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
}); //post poll

app.get("/otherPolls", function(req, res){
	if(!req.session.sessionID){
		req.session.reset();
		res.redirect("/");
	}
	else{
		getCommunityPollList(req.session, function(){
			res.render("otherPolls",  {seshName: req.session.sessionName, polls: sessionCommPolls});	
		});
	}
});

app.get("/editPoll/:id", function(req, res) {
   if(!req.session.sessionID){
   	req.session.reset();
		res.redirect("/");
	}
	else{
		Poll.findOne({"_id": req.params.id, "userID": req.session.sessionID}).lean().exec(function(err, doc) {
		var thePoll = {"_id": doc._id, "pollName": doc.title, "pollOptions": doc.options};
		res.render("editPoll", {seshName: req.session.sessionName, poll: thePoll, pollID: req.params.id, success:req.session.successMessage});
		});
	}
});

app.post("/editPoll/:id", function(req, res){  //register a vote for a poll's option
	if(!req.session.sessionID){
		req.session.reset();
		res.redirect("/");
	}
	else{
		var pollID = req.params.id;
		var pollName = req.body.pollName;
		var options = req.body.options;
		var optionsWithTallies = [];
		
		async.each(options, appendOption, renderDash);
	
	function appendOption(option, callback){
		var appendThis = {"text": option, "votes": []};
		optionsWithTallies.push(appendThis);
		return callback(null);
	}
	function renderDash(){
			if(pollName.length > 1 && options.length > 1){
				req.session.errorMessage = null;
				req.session.successMessage = "Poll updated!";
				Poll.update({"_id":pollID}, {"title": pollName, "options": optionsWithTallies}, function(){
				res.redirect("editPoll/" + pollID);
				});
			}
   			else{
		req.session.errorMessage = "Error: you submitted a poll with a title of inadequate length, a title that's already taken, or has an insufficient number of options. Try again.";
		req.session.successMessage = null;
		getMyPollList(req.session, function(){
			res.redirect("editPoll/" + pollID);
		});
			}
	}
	}
}); //post poll

app.use(function(req, res) {
	res.status(404).render("404", {seshName: req.session.sessionName});
});
/*app.use(function(error, req, res, next) {
    res.status(500).render("500", {seshName: req.session.sessionName});
});*/

function getMyPollList(session, callback){
		sessionMyPolls = [];
		var userPolls = Poll.find({"userID": session.sessionID}).stream();
		userPolls.on("data", function(pollData){
			sessionMyPolls.push({"id": pollData._id, "name": pollData.title});
		});
		userPolls.on("end", function(){
			callback();
		});
}
function getCommunityPollList(session, callback){
		sessionCommPolls = [];
		var userPolls = Poll.find({"userID": {$ne: session.sessionID}}).stream();
		userPolls.on("data", function(pollData){
			sessionCommPolls.push({"id": pollData._id, "name": pollData.title});
		});
		userPolls.on("end", function(){
			callback();
		});
}
}