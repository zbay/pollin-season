module.exports = function(app) {
    var mongoose = require('mongoose');
     var Shared = require(process.cwd() + "/dbmodels/shared.js"); Shared = mongoose.model("Shared");
      var Poll = require(process.cwd() + "/dbmodels/poll.js"); Poll = mongoose.model("Poll");
     var requireLogin = require(process.cwd() + "/controlHelpers/requireLogin.js");
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
}