var mongoose = require('mongoose');
var UserSchema = new mongoose.schema({"name": String, "email": String, "password": String});
  
mongoose.model('User', UserSchema);