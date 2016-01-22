module.exports = function(){
var getter = {};
var async = require('async');
var mongoose = require('mongoose');
     var Poll = require(process.cwd() + "/dbmodels/poll.js"); Poll = mongoose.model("Poll");
     var Shared = require(process.cwd() + "/dbmodels/shared.js"); Shared = mongoose.model("Shared");
         getter.getSharedPollList = function(session, callback){
            session.sharedPolls = [];
	    	Shared.find({"sharee": session.sessionID}, function(err, data){
				async.each(data, appendPoll, returnPolls);	    		
	    	});
	    	
	    	function appendPoll(poll, callback){
	    		Poll.findOne({"_id": poll.pollID}, function(err, doc){
		    	if(doc && !err){
		    		session.sharedPolls.push({"id": doc._id, "name": doc.title, "userID": doc.userID, "userName": doc.creatorName});	
		    	}
		    	return callback();
		    });
	    	}
	    	function returnPolls(){
	    		callback();
	    	}
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
		    userPolls.on("error", function(){
		    	callback("ERROR");
		    });
		    userPolls.on("end", function(){
			    callback(null);
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