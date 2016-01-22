module.exports = function(app) {
    var mongoose = require('mongoose');
    var Poll = require(process.cwd() + "/dbmodels/poll.js"); Poll = mongoose.model("Poll");
    var async = require('async');
    var requireLogin = require(process.cwd() + "/controlHelpers/requireLogin.js");
    
app.get("/newPoll", requireLogin, function(req, res){
		req.session.successMessage = null;
		req.session.errorMessage = null;
		res.render("newPoll", {seshName: req.session.sessionName});	
});

app.post("/newPoll", requireLogin, function(req, res){ //adding a poll from the user's account
	var pollName = req.body.pollName;
	var options = req.body.options;
	var optionsWithTallies = [];
	var userID;
	if(pollName.length > 1 && options.length > 1){
	async.each(options, appendOption, renderDash);
	}
	else{
		req.session.errorMessage = "You submitted a poll with a title of inadequate length, a title that's already taken, or has an insufficient number of options. Try again.";
		req.session.successMessage = null;
		res.render("newPoll", {seshName: req.session.sessionName, error: req.session.errorMessage});
	}
	
	function appendOption(option, callback){
		if(option.length > 0){
		var appendThis = {"text": option, "votes": []};
		optionsWithTallies.push(appendThis);
		}
		return callback(null);
	}
	function renderDash(){
		if(optionsWithTallies.length > 1){
			var newPoll = new Poll({"userID": req.session.sessionID, "creatorName": req.session.sessionName, "title": pollName, "options": optionsWithTallies});	
   			newPoll.save(function(){
   			req.session.successMessage = "Poll added!";
			res.render("newPoll", {seshName: req.session.sessionName, success: req.session.successMessage});
   			});
		}
		else{
			req.session.errorMessage = "You did not submit enough options containing text! Try again.";
			res.render("newPoll", {seshName: req.session.sessionName, error: req.session.errorMessage});
		}
	}
	});
}