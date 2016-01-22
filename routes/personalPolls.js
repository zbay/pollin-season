module.exports = function(app) {
     var mongoose = require('mongoose');
     var Poll = require(process.cwd() + "/dbmodels/poll.js"); Poll = mongoose.model("Poll");
     var Shared = require(process.cwd() + "/dbmodels/shared.js"); Shared = mongoose.model("Shared");
     var requireLogin = require(process.cwd() + "/controlHelpers/requireLogin.js");
     var pollGetter = require(process.cwd() + "/controlHelpers/pollGetter.js"); pollGetter = pollGetter();
app.get("/myPolls", requireLogin, function(req, res){
		req.session.successMessage = null;
		req.session.errorMessage = null;
		pollGetter.getUserPollList(req.session, req.session.sessionID, true, function(){
			res.render("myPolls", {seshName: req.session.sessionName, polls: req.session.myPolls});	
		});
});
app.get("/sharedPolls", requireLogin, function(req, res){
		req.session.successMessage = null;
		req.session.errorMessage = null;
		pollGetter.pollGetter.getSharedPollList(req.session, function(){
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
}