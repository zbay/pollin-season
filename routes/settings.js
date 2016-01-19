function settings(app)
{
    app.get("/settings", requireLogin, function(req, res){
		req.session.successMessage = null;
		req.session.errorMessage = null;
		res.render("settings", {seshName: req.session.sessionName, seshEmail: req.session.sessionEmail});
});

app.post("/settings", requireLogin, function(req, res){ //submit changes to account info
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
});   
}
module.exports = settings;