module.exports = function(app) {
    var bcrypt = require("bcrypt");
    var mongoose = require('mongoose');
    var User = require("../dbmodels/user.js");
    User = mongoose.model("User");
app.get("/signup", function(req, res){
	if(!req.session.sessionID){
		res.render('signup', {});
	}
	else{
		req.session.successMessage = null;
		req.session.errorMessage = null;
		res.redirect("/newPoll");
	}
});

app.post('/signup', function(req, res){ //submit new account info
	if(req.session.sessionID){
		res.redirect("/newPoll");
	}
else{
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var hashedPassword = bcrypt.hashSync(password, 10);
  var emailRegex = /@/;
  
  if(name && email && password && name.length > 2 && email.match(emailRegex) && password.length > 6){
   var newUser = new User({"name": name, "email":email, "password": hashedPassword}); 
   newUser.save(function(err, message){
   	if(!err)
   	{
   User.findOne({"email": email}).lean().exec(function(findErr, data){
   if(!findErr){
   req.session.successMessage = "Account successfully created!";
   req.session.errorMessage = null;
   res.redirect("/login");
   	}
   	else{
   		res.render("signup", {error:findErr});
   	}
   });
   	}
   	else{
   		req.session.successMessage = null;
   		req.session.errorMessage = "An account already exists with this email address! Use another one.";
   		res.render("signup", {error:req.session.errorMessage});
   	}
   });

  }
  else{
  	req.session.errorMessage = "Error: invalid information. Enter a valid email, a name longer than 2 characters, and a password longer than 6 characters.";
  	req.session.successMessage = null;
  	res.render('signup', {seshName: req.session.sessionName, error: req.session.errorMessage});
  }
}
});
}