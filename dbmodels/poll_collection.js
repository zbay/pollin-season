var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PollCollectionSchema = new Schema
({"userID": Schema.ObjectId, 
    "polls":[{"title": String, 
        "options": [{"text": String, "votes": Number}]}]});
  
mongoose.model('PollCollection', PollCollectionSchema);