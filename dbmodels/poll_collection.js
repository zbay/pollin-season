var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var PollCollectionSchema = new Schema
({"email": String, 
    "polls":[{"title": String, 
        "options": [{"text": String, "frequency": Number}]}]});
  
mongoose.model('PollCollection', PollCollectionSchema);