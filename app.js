'use strict';

var mongoose = require('mongoose');
var db = mongoose.connection;

var express = require('express');
var app = express();
var mongo = require('mongodb');
var bodyParser = require('body-parser');
var routes = require('./routes');
var session = require('client-sessions');
//var dotenv = require('dotenv').load();
console.log("started at least");

mongoose.connect('mongodb://heroku_l51d2vps:2aq0iso1kf2gjkv2b8tb1nm5g8@ds045475.mongolab.com:45475/heroku_l51d2vps', function (err, db)
//mongoose.connect('mongodb://localhost:27017/votingapp', function (err, db)
{
 if (err) {
      throw new Error('Database failed to connect!');
   } else {
      console.log('Successfully connected to MongoDB.');

app.use('/static', express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  cookieName: 'session',
  //secret: process.env.SESSION_SECRET,
  secret:"oogity boogity7",
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));

app.set('view engine', 'jade');
app.set('views', __dirname + '/templates');

routes.set(app); 

app.listen(process.env.PORT || 8080, function(){
	console.log("The frontend server is running on port 8080.");
}); //listen 8080
}
});