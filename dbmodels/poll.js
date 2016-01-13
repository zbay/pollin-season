var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PollSchema = new Schema
({"userID": Schema.ObjectId, "creatorName": String, "title": {type: String, unique: true}, options: [{"text": String, "votes": [Schema.ObjectId]}]});
  
mongoose.model('Poll', PollSchema);