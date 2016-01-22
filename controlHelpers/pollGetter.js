module.exports = function(){ //http://liangzan.net/blog/blog/2012/06/04/how-to-use-exports-in-nodejs/
var getter = {};
        var mongoose = require('mongoose');
     var Poll = require(process.cwd() + "/dbmodels/poll.js"); Poll = mongoose.model("Poll");
     var Shared = require(process.cwd() + "/dbmodels/shared.js"); Shared = mongoose.model("Shared");
         getter.getSharedPollList = function(session, callback){
            session.sharedPolls = [];
	    	var shared = Shared.find({"sharee": session.sessionID}).stream();
		    shared.on("data", function(pollData){
		    Poll.find({"_id": pollData.pollId}, function(err, data){
		        session.sharedPolls.push({"id": data._id, "name": data.title});
		    });
		    });
		    shared.on("end", function(){
			    callback();
	    	});
         }
            getter.getUserPollList = function(session, userID, isMine, callback){
            session.visitedUserPolls = [];
            session.myPolls = [];
		    var userPolls = Poll.find({"userID": userID}).stream();
		    userPolls.on("data", function(pollData){
		        if(isMine){
		            session.myPolls.push({"id": pollData._id, "name": pollData.title});
		        }
		        else{
		         session.visitedUserPolls.push({"id": pollData._id, "name": pollData.title});   
		        }
		    });
		    userPolls.on("end", function(){
			    callback();
		});
         }
            getter.getCommunityPollList = function(session, callback){
             session.commPolls = [];
		     var userPolls = Poll.find({"userID": {$ne: session.sessionID}}).limit(100).stream();
		    userPolls.on("data", function(pollData){
			    session.commPolls.push({"id": pollData._id, "name": pollData.title, "userID": pollData.userID, "userName": pollData.creatorName});
		    });
		    userPolls.on("end", function(){
			    callback();
	    	});
         };
         return getter;
 };