module.exports = function(app) {
    var async = require('async');
     var requireLogin = require(process.cwd() + "/controlHelpers/requireLogin.js");
    var mongoose = require('mongoose');
     var Poll = require(process.cwd() + "/dbmodels/poll.js"); Poll = mongoose.model("Poll");
app.get("/editPoll/:id", requireLogin, function(req, res) {
		Poll.findOne({"_id": req.params.id, "userID": req.session.sessionID}).lean().exec(function(err, doc) {
			if(doc && !err){
		var thePoll = {"_id": doc._id, "pollName": doc.title, "pollOptions": doc.options};
		res.render("editPoll", {seshName: req.session.sessionName, poll: thePoll, pollID: req.params.id, success:req.session.successMessage, error:req.session.errorMessage});
			}
			else{
				res.status(404).render("404", {seshName: req.session.sessionName});
			}
			});
});

app.post("/editPoll/:id", requireLogin, function(req, res){  //register a vote for a poll's option
		var pollID = req.params.id;
		var pollName = req.body.pollName;
		var options = req.body.options;
		var optionsWithTallies = [];
		
		async.each(options, appendOption, renderDash);
	
	function appendOption(option, callback){
		if(option.length > 0){
		var appendThis = {"text": option, "votes": []};
		optionsWithTallies.push(appendThis);
		}
		return callback(null);
	}
	function renderDash(){
			if(pollName.length > 1 && options.length > 1 && optionsWithTallies.length > 1){
				req.session.errorMessage = null;
				req.session.successMessage = "Poll updated!";
				Poll.update({"_id":pollID}, {"title": pollName, "options": optionsWithTallies}, function(err, doc){
					if(doc && !err){
				res.redirect("editPoll/" + pollID);
					}
					else{
					res.status(404).render("404", {seshName: req.session.sessionName});	
					}
				});
			}
   			else{
		req.session.errorMessage = "Error: you submitted a poll with a title of inadequate length, a title that's already taken, or has an insufficient number of options. Try again.";
		req.session.successMessage = null;
		res.redirect("editPoll/" + pollID);
			}
	}
}); //post poll
}