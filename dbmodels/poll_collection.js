var mongoose = require('mongoose');
var PollCollectionSchema = new mongoose.schema({"email": String, "polls": [{"title": String, "options": [String]}]});
  
mongoose.model('PollCollection', PollCollectionSchema);