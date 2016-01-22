function routers(app){
	
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
var bcrypt = require('bcrypt');
var async = require('async');
var mongoose = require('mongoose');
var requireLogin = require(process.cwd() + "/controlHelpers/requireLogin.js");
var User = require(process.cwd() + "/dbmodels/user.js"); User = mongoose.model("User");
var Poll = require(process.cwd() + "/dbmodels/poll.js"); Poll = mongoose.model("Poll");
var Shared = require(process.cwd() + "/dbmodels/shared.js"); Shared = mongoose.model("Shared");
var pollGetter = require(process.cwd() + "/controlHelpers/pollGetter.js");
//poll doesn't show 404 on unknown ID. Fix that.
}
module.exports = routers;