module.exports.set = function(app) {
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var async = require('async');
var User = require("../dbmodels/user.js");
var Poll = require("../dbmodels/poll.js");
User = mongoose.model("User");
Poll = mongoose.model("Poll");
var isLoggedIn = false;
var errorMessage = null;
var successMessage = null;
var sessionEmail = null;
var sessionName = null;
var sessionID;
var sessionMyPolls = [];
var sessionCommPolls = [];

app.get('/', function(req, res){
	var path = req.path;
	res.locals.path = path;
	if(isLoggedIn){
		res.redirect("/dashboard");
	}
	else{
		successMessage = null;
		errorMessage = null;
		res.render('index', {seshName: sessionName, loggedIn: isLoggedIn});	
	}
});

app.get('/login', function(req, res){ //access login page
	if(!isLoggedIn){
		res.render('login', {seshName: sessionName, loggedIn: isLoggedIn, success: successMessage});
	}
	else{
		successMessage = null;
		errorMessage = null;
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
  		isLoggedIn = true;
  		sessionEmail = email;
  		sessionName = doc.name;
  		sessionID = doc._id;
  		res.redirect("/dashboard");
  		}
  		else{
    	errorMessage = "Error: incorrect email or password. Try again.";
    	res.render("login", {seshName: sessionName, loggedIn: isLoggedIn, error: errorMessage});
    }
  	}
    else{
    	errorMessage = "Error: incorrect email or password. Try again.";
    	res.render("login", {seshName: sessionName, loggedIn: isLoggedIn, error: errorMessage});
    }
  });
});

app.get('/logout', function(req, res){ //sign out
	isLoggedIn = false;
	sessionEmail = null;
	sessionName = null;
	successMessage = null;
	errorMessage = null;
	sessionID = null;
	res.redirect("/");
});

app.get("/signup", function(req, res){
	if(!isLoggedIn){
		res.render('signup', {seshName: sessionName, loggedIn: isLoggedIn});
	}
	else{
		successMessage = null;
		errorMessage = null;
		res.redirect("/dashboard");
	}
});

app.post('/signup', function(req, res){ //submit new account info
	if(isLoggedIn){
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
   var userID;
   User.findOne({"email": email}).lean().exec(function(err, data){
   if(!err){
   userID = data._id;	
   successMessage = "Account successfully created!";
   errorMessage = null;
   res.redirect("/login");
   	}
   });
   });

  }
  else{
  	errorMessage = "Error: invalid information. Enter a valid email, a name longer than 2 characters, and a password longer than 6 characters.";
  	successMessage = null;
  	res.render('signup', {seshName: sessionName, loggedIn: isLoggedIn, error: errorMessage});
  }
}

});

app.get("/settings", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		successMessage = null;
		errorMessage = null;
		res.render("settings", {seshName: sessionName, seshEmail: sessionEmail, loggedIn: isLoggedIn});
	}
});

app.post("/settings", function(req, res){ //submit changes to account info
    if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var newName = req.body.name;
		var newEmail = req.body.email;
		var currentPassword = req.body.currentPassword;
		var newPassword = req.body.newPassword;
		
		User.findOne({"email": sessionEmail}).lean().exec(function(err, doc){
			var hashedPassword = doc.password;
  	if(doc && !err && newPassword.length > 6 && bcrypt.compareSync(currentPassword, hashedPassword)){
  		var userID = doc._id;
  		User.update({"email": sessionEmail}, {"$set": {"password": bcrypt.hashSync(newPassword, 10), "name": newName, "email": newEmail}}, function(err, data){
  			if(!err){
  					sessionEmail = newEmail;
  					sessionName = newName;
  					successMessage = "Info successfully changed!";
  					errorMessage = null;
  					res.render("settings", {seshName: sessionName, loggedIn: isLoggedIn, seshEmail: sessionEmail, success: successMessage});
  			}
  		});
  	}
    else{
    	errorMessage = "Error: unsuccessful password change. Make sure you entered your old one correctly, and that the new one is at least 7 characters in length.";
    	successMessage = null;
    	res.render("settings", {seshName: sessionName, loggedIn: isLoggedIn, seshEmail: sessionEmail, error: errorMessage});
    }
  });
	}
});

app.get("/dashboard", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	} //if not logged in
	else{
		successMessage = null;
		errorMessage = null;
		getMyPollList(function(){
			res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, polls: sessionMyPolls});	
		});
	} //else if not logged in
});

app.post("/dashboard", function(req, res){ //adding or deleting a poll from the user's account
	    if(!isLoggedIn){
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
   			var newPoll = new Poll({"userID": sessionID, "creatorName": sessionName, "title": pollName, "options": optionsWithTallies});	
   			newPoll.save(function(){
   			  		getMyPollList(function(){
   			  			successMessage = "Poll added!";
			res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, polls: sessionMyPolls, success: successMessage});
		}); // if no error
   			});
			}
   			else{
		errorMessage = "Error: you submitted a poll with a title of inadequate length, a title that's already taken, or has an insufficient number of options. Try again.";
		successMessage = "";
		getMyPollList(function(){
			res.render("dashboardAJAX", {seshName: sessionName, loggedIn: isLoggedIn, polls: sessionMyPolls, error: errorMessage});
		});
			}
	}
	}
	});
app.delete("/dashboard", function(req, res){
		console.log("deletePoll event");
			var deleteThis = req.body.deleteID;
			sessionMyPolls = [];
			Poll.remove({"_id": deleteThis, "userID": sessionID}).lean().exec(function(err, data){

			if(err || data.result.n == 0){
				errorMessage = "Error. You're not allowed to delete that poll because you did not create it! Sorry.";
				res.send(JSON.stringify({ error:errorMessage }));
				//res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, polls: sessionMyPolls, error: errorMessage, displayDelete: true});	
			//getUpdatedPollList
			} //err
			else{
				successMessage = "Poll removed.";
				errorMessage = "";
				res.send(JSON.stringify({ success: successMessage  }));
				//res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, polls: sessionMyPolls, success: successMessage, displayDelete: true});	
			} //!err
		}); //Poll.remove
});

app.get("/polls/:id", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		Poll.findOne({"_id": req.params.id}).lean().exec(function(err, doc) {
		var thePoll = {"_id": doc._id, "pollName": doc.title, "pollOptions": doc.options, "creatorName": doc.creatorName};
		res.render("poll", {seshName: sessionName, loggedIn: isLoggedIn, poll: thePoll, pollID: req.params.id, success:successMessage});
		});
	}
}); //get poll

app.post("/polls/:id", function(req, res){  //register a vote for a poll's option
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var pollID = req.params.id;
		var optionID = req.body.incrementID;
	/*	Poll.findOne({"_id": pollID, "options._id": optionID, sessionID: {$in: "options.$.votes"}}).lean().exec(function(err, doc){
			console.log(err);
		});*/
		Poll.update({"_id": pollID, "options._id": optionID}, {$addToSet: {"options.$.votes": sessionID}}).lean().exec(function(err, doc){
			errorMessage="";
			if(doc.nModified == 0){
				successMessage = "Vote removed!";
				Poll.update({"_id": pollID, "options._id": optionID}, {$pull: {"options.$.votes": sessionID}}, function(){
					res.redirect("/polls/" + pollID);
				});
			}
			else{
				successMessage="Vote cast!";
				res.redirect("/polls/" + pollID);
			}
		});
	}
}); //post poll

app.get("/otherPolls", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		getCommunityPollList(function(){
			res.render("otherPolls",  {seshName: sessionName, loggedIn: isLoggedIn, polls: sessionCommPolls});	
		});
	}
});

app.get("/editPoll/:id", function(req, res) {
   	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		Poll.findOne({"_id": req.params.id, "userID": sessionID}).lean().exec(function(err, doc) {
		var thePoll = {"_id": doc._id, "pollName": doc.title, "pollOptions": doc.options};
		res.render("editPoll", {seshName: sessionName, loggedIn: isLoggedIn, poll: thePoll, pollID: req.params.id, success:successMessage});
		});
	}
});

app.post("/editPoll/:id", function(req, res){  //register a vote for a poll's option
	if(!isLoggedIn){
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
				errorMessage = "";
				successMessage = "Poll updated!";
				Poll.update({"_id":pollID}, {"title": pollName, "options": optionsWithTallies}, function(){
				res.redirect("editPoll/" + pollID);
				});
			}
   			else{
		errorMessage = "Error: you submitted a poll with a title of inadequate length, a title that's already taken, or has an insufficient number of options. Try again.";
		successMessage = "";
		getMyPollList(function(){
			res.redirect("editPoll/" + pollID);
		});
			}
	}
	}
}); //post poll

app.use(function(req, res) {
	res.status(404).render("404", {seshName: sessionName, loggedIn: isLoggedIn});
});
/*app.use(function(error, req, res, next) {
    res.status(500).render("500", {seshName: sessionName, loggedIn: isLoggedIn});
});*/

function getMyPollList(callback){
		sessionMyPolls = [];
		var userPolls = Poll.find({"userID": sessionID}).stream();
		userPolls.on("data", function(pollData){
			sessionMyPolls.push({"id": pollData._id, "name": pollData.title});
		});
		userPolls.on("end", function(){
			callback();
		});
}
function getCommunityPollList(callback){
		sessionCommPolls = [];
		var userPolls = Poll.find({"userID": {$ne: sessionID}}).stream();
		userPolls.on("data", function(pollData){
			sessionCommPolls.push({"id": pollData._id, "name": pollData.title});
		});
		userPolls.on("end", function(){
			callback();
		});
}
}