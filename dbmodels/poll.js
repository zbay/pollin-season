var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PollSchema = new Schema
({"userID": Schema.ObjectId, "title": {type: String, unique: true}, options: [{"text": String, "votes": Number}]});
  
mongoose.model('Poll', PollSchema);