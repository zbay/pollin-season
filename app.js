'use strict';

var express = require('express');
var app = express();
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var crypto = require('crypto');

var app = express();
var isLoggedIn = false;
var sessionEmail = "";
var sessionName = "";
var successMessage = "";
var errorMessage = "";

mongo.connect('mongodb://localhost:27017/votingapp', function (err, db) 
{
 if (err) {
      throw new Error('Database failed to connect!');
   } else {
      console.log('Successfully connected to MongoDB on port 27017.');
      
app.use('/static', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser());

app.set('view engine', 'jade');
app.set('views', __dirname + '/templates');
var users = db.collection("users");
var polls = db.collection("polls");

/*app.get('*', function(req, res){
  res.send('Page not found', 404);
});*/

app.get('/', function(req, res){
	var path = req.path;
	res.locals.path = path;
	if(isLoggedIn){
		res.redirect("/dashboard");
	}
	else{
		res.render('index');	
	}
});

app.get('/login', function(req, res){
	if(!isLoggedIn){
		res.render('login');
	}
	else{
		res.redirect("/dashboard");
	}
});

app.post('/login', function(req, res){
  var email = req.body.email;
  var password = req.body.password;
  users.findOne({"email": email, "password": password}, function(err, doc){
  	if(doc && !err){
  		isLoggedIn = true;
  		sessionEmail = email;
  		sessionName = users.findOne({"email": email}).name;
  		res.redirect("/dashboard");
  	}
    else{
    	//Display error message
    	errorMessage = "Incorrect email or password. Try again.";
    	successMessage = "";
    	res.render("login");
    }
  });
});

app.get('/logout', function(req, res){
	isLoggedIn = false;
	sessionEmail = "";
	sessionName = "";
	res.redirect("/index");
});

app.get("/signup", function(req, res){
	if(!isLoggedIn){
		res.render('signup');
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
  var emailRegex = /@/;
  
  if(name && email && password && name.length > 2 && email.match(emailRegex) && password.length > 6){
   users.insert({"name":name, "email":email, "password":password});	
   polls.insert({"email": email, "polls": []});
   successMessage = "Account successfully created!";
   errorMessage = "";
   console.log("Inserting data");
   res.render("login");
  }
  else{
  	//add error mesage
  	errorMessage = "Invalid information. Enter a valid email, a name longer than 2 characters, and a password longer than 6 characters.";
  	successMessage = "";
  	console.log("Not inserting data");
  	res.render('signup');
  }
}

});

app.get("/settings", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		res.render("settings");
	}
});

app.post("/settings", function(req, res){
    if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var currentPassword = req.params.currentPassword;
		var newPassword = req.params.newPassword;
		var currentPasswordExists = false;
		db.userlist.findOne({"password": currentPassword}, function(err, doc){
  	if(doc && !err && newPassword.length > 6){
  		users.update({"email": sessionEmail, "password": currentPassword}, {"$set": {"password":newPassword}});
  		//display success message
  		successMessage = "Password successfully changed!";
  		errorMessage = "";
  		res.render("settings");
  	}
    else{
    	//Display error message
    	errorMessage = "There was an error when changing your password. Make sure it's at least 7 characters in length.";
    	successMessage = "";
    	res.render("settings");
    }
  });
	}
});

app.get("/dashboard", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var pollNames = polls.find({"email": sessionEmail}); //FIX THIS
		//console.log(pollNames);
		res.render("dashboard");
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
	for(var i = 0; i < options.length; i++){
		var appendThis = {"text": options[i], "votes": 0};
		optionsWithTallies.push(appendThis);
	}

	if(pollName.length > 1 && options.length > 1){
		polls.update({"email": sessionEmail }, {"$addToSet": {"polls": {"title": pollName, "options": optionsWithTallies}}}, true, function(err, data){
			if(err){
			 console.log(err);	
			}
		});
		successMessage = "Poll created.";
		errorMessage = "";
		res.render("dashboard");
	}
	else{
		//display error message
		errorMessage = "You submitted a poll title of inadequate length, or a quiz with an insufficient number of options. Try again.";
		successMessage = "";
		res.render("dashboard");
	}
	}
	
});

app.delete("/dashboard", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var pollName = req.params.pollName;
		polls.remove({"title":pollName});
		successMessage = "Poll removed.";
		errorMessage = "";
		res.render("dashboard");
	}
});

app.get("/polls/:name", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var pollName = req.params.name;
		var thePoll = polls.findOne({"email": sessionEmail, "polls.title": pollName});
		var thePollOptions = thePoll.polls.options;
		res.render("poll");
	}
});

app.post("/polls/:name", function(req, res){
	if(!isLoggedIn){
		res.redirect("/");
	}
	else{
		var name = req.params.name;
		var optionName = req.params.optionName;
		var userToIncrement = polls.findOne({"email": sessionEmail});
		var pollToIncrement = userToIncrement.findOne({"polls.title": name});
		pollToIncrement.update({"options.text": optionName}, {$inc: {"frequency": 1}});
		successMessage = "Vote cast!";
		errorMessage = "";
		res.render("poll");
	}
});


app.listen(8080, function() {
	console.log("The frontend server is running on port 8080.");
});
}
});

//12/29: iron out dashboard rendering, then try to run the dumb thing