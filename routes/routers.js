function routers(app){
	//all of the app's route controllers
var signInOrOut = require("./signInOrOut.js"); signInOrOut(app);
var home = require("./home.js"); home(app);
var signup = require("./signup.js"); signup(app);
var settings = require("./settings.js"); settings(app);
var newPolls = require("./newPolls.js"); newPolls(app);
var retrievePolls = require("./retrievePolls.js"); retrievePolls(app);
var otherUsers = require("./otherUsers.js"); otherUsers(app);
var pollEdit = require("./pollEdit.js"); pollEdit(app);
var pollVote = require("./pollVote.js"); pollVote(app);
var httpErrors = require("./httpErrors.js"); httpErrors(app);
//poll doesn't show 404 on unknown ID. Fix that.
}
module.exports = routers;