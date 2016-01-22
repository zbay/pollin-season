var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var SharedSchema = new Schema({"sharer": String, "sharee": Schema.ObjectId, "pollID": Schema.ObjectId});
  
mongoose.model('Shared', SharedSchema);