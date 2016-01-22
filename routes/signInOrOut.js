module.exports = function(app) {
    var bcrypt = require('bcrypt');
     var mongoose = require('mongoose');
     var User = require("../dbmodels/user.js"); User = mongoose.model("User");

app.get('/login', function(req, res){ //access login page
	if(!req.session.sessionID){
		res.render('login', {success: req.session.successMessage});
	}
	else{
		res.redirect("/newPoll");
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
  		res.redirect("/newPoll");
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
}