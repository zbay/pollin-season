module.exports = function(app) {
    var bcrypt = require('bcrypt');
     var mongoose = require('mongoose');
     var User = require("../dbmodels/user.js");  User = mongoose.model("User");
     var Shared = require(process.cwd() + "/dbmodels/shared.js"); Shared = mongoose.model("Shared");
     var requireLogin = require(process.cwd() + "/controlHelpers/requireLogin.js");
     var pollGetter = require(process.cwd() + "/controlHelpers/pollGetter.js"); pollGetter = pollGetter();
     
     app.get("/users/:id", requireLogin, function(req, res){
	var userID = req.params.id;
	pollGetter.getUserPollList(req.session, userID, false, function(){
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
}