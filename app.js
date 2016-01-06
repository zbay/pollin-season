'use strict';

// 1/6/16: Render polls. Use IDs as URLs rather than names?
var mongoose = require('mongoose');
var User = require("./dbmodels/user.js");
var PollCollection = require("./dbmodels/poll_collection.js");
var db = mongoose.connection;

var User = mongoose.model("User");
var PollCollection = mongoose.model("PollCollection");

var express = require('express');
var app = express();
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');

var app = express();
var isLoggedIn = false;
var errorMessage = "";
var successMessage = "";
var sessionEmail = "";
var sessionName = "";
var sessionID;
var pollNames = [];
var pollIDs = [];

mongoose.connect('mongodb://localhost:27017/votingapp', function (err, db)
{
 if (err) {
      throw new Error('Database failed to connect!');
   } else {
      console.log('Successfully connected to MongoDB on port 27017.');
      
app.use('/static', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'jade');
app.set('views', __dirname + '/templates');

app.get('/', function(req, res){
	var path = req.path;
	res.locals.path = path;
	if(isLoggedIn){
		res.redirect("/dashboard");
	}
	else{
		res.render('index', {seshName: sessionName, loggedIn: isLoggedIn});	
	}
});

app.get('/login', function(req, res){
	if(!isLoggedIn){
		res.render('login', {seshName: sessionName, loggedIn: isLoggedIn, success: successMessage});
	}
	else{
		res.redirect("/dashboard");
	}
});

app.post('/login', function(req, res){
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
    	errorMessage = "Incorrect email or password. Try again.";
    	res.render("login", {seshName: sessionName, loggedIn: isLoggedIn, error: errorMessage});
    }
  	}
    else{
    	errorMessage = "Incorrect email or password. Try again.";
    	res.render("login", {seshName: sessionName, loggedIn: isLoggedIn, error: errorMessage});
    }
  });
});

app.get('/logout', function(req, res){
	isLoggedIn = false;
	sessionEmail = "";
	sessionName = "";
	sessionID = null;
	res.redirect("/");
});

app.get("/signup", function(req, res){
	if(!isLoggedIn){
		res.render('signup', {seshName: sessionName, loggedIn: isLoggedIn});
	}
	else{
		res.redirect("/dashboard");
	}
});

app.post('/signup', function(req, res){
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
   var newPollCollection = new PollCollection({"userID": userID, "polls": []});
   newPollCollection.save();
   successMessage = "Account successfully created!";
   errorMessage = "";
   res.redirect("/login");
   	}
   });
   });

  }
  else{
  	errorMessage = "Invalid information. Enter a valid email, a name longer than 2 characters, and a password longer than 6 characters.";
  	successMessage = "";
  	res.render('signup', {seshName: sessionName, loggedIn: isLoggedIn, error: errorMessage});
  }
}

});

app.get("/settings", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		res.render("settings", {seshName: sessionName, loggedIn: isLoggedIn});
	}
});

app.post("/settings", function(req, res){
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
  					errorMessage = "";
  					res.render("settings", {seshName: sessionName, loggedIn: isLoggedIn, seshEmail: sessionEmail, success: successMessage});
  			}
  		});
  	}
    else{
    	errorMessage = "There was an error when changing your password. Make sure you entered your old one correctly, and that the new one is at least 7 characters in length.";
    	successMessage = "";
    	res.render("settings", {seshName: sessionName, loggedIn: isLoggedIn, seshEmail: sessionEmail, error: errorMessage});
    }
  });
	}
});

app.get("/dashboard", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		pollNames = [];
		pollIDs = [];
		PollCollection.find({"userID": sessionID}, {"polls.title": 1, "polls._id": 1}).lean().exec(function(err, doc){
			if(!err && doc.length){
			for(var i = 0; i < doc[0].polls.length; i++){
				pollNames.push(doc[0].polls[i].title);
				pollIDs.push(doc[0].polls[i]._id);
			}
			console.log(pollIDs);
			res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, pollTitles: pollNames});
			}
			else{
				res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, pollTitles: pollNames});
			}
		});
	}
});

app.post("/dashboard", function(req, res){
	    if(!isLoggedIn){
		res.redirect("/");
	}
	else{
	var pollName = req.body.pollName;
	var options = req.body.options;
	var optionsWithTallies = [];
	var userID;
	for(var i = 0; i < options.length; i++){
		var appendThis = {"text": options[i], "votes": 0};
		optionsWithTallies.push(appendThis);
	}

	if(pollName.length > 1 && options.length > 1){
	   User.findOne({"email": sessionEmail}).lean().exec(function(err, data){
   		if(!err){
   			userID = data._id;	
   			PollCollection.update({"userID": userID }, {"$addToSet": {"polls": {"title": pollName, "options": optionsWithTallies}}}, function(err, data){
			if(err){
			 console.log(err);	
			}
			else{
				pollNames.push(pollName);
			}
		});
		successMessage = "Poll created.";
		errorMessage = "";
		res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, pollTitles: pollNames, pollURLs: pollIDs, success: successMessage});
   		}
   });
	}
	else{
		errorMessage = "You submitted a poll title of inadequate length, or a quiz with an insufficient number of options. Try again.";
		successMessage = "";
		res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, error: errorMessage});
	}
	}
	
});

app.delete("/dashboard", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var deleteName = req.body.deleteName;
		PollCollection.update({"userID": sessionID}, {$pull: {"polls": {"title": deleteName}}}, function(err, data) {
		var nameIndex = pollNames.indexOf(deleteName);
		pollNames.splice(nameIndex, 1);
		successMessage = "Poll removed.";
		errorMessage = "";
		res.render("dashboard", {seshName: sessionName, loggedIn: isLoggedIn, pollTitles: pollNames, success: successMessage, error: errorMessage});
		});
		}
	});

app.get("/polls/:name", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var pollName = req.params.name;
		var thePoll = PollCollection.findOne({"email": sessionEmail, "polls.title": pollName});
		var thePollOptions = thePoll.polls.options;
		res.render("poll", {seshName: sessionName, loggedIn: isLoggedIn});
	}
});

app.post("/polls/:name", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var name = req.params.name;
		var optionName = req.params.optionName;
		var userToIncrement = PollCollection.findOne({"email": sessionEmail});
		var pollToIncrement = userToIncrement.findOne({"polls.title": name});
		pollToIncrement.update({"options.text": optionName}, {$inc: {"frequency": 1}});
		successMessage = "Vote cast!";
		errorMessage = "";
		res.render("poll", {seshName: sessionName, loggedIn: isLoggedIn});
	}
});

app.use(function(req, res) {
	res.status(404).render("404", {seshName: sessionName, loggedIn: isLoggedIn});
});
app.use(function(error, req, res, next) {
    res.status(500).render("500", {seshName: sessionName, loggedIn: isLoggedIn});
});


app.listen(8080, function() {
	console.log("The frontend server is running on port 8080.");
});
}
});