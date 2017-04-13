const express = require('express');
const config = require('./config/config');
const app = express();

//  var multer	= require('multer');
//  var storage = multer.diskStorage({
//    destination: function (req, file, callback) {
//      callback(null, './uploads');
//    },
//    filename: function (req, file, callback) {
//      callback(null, file.fieldname + '-' + Date.now());
//    }
//  });
//  var upload = multer({ storage : storage}).single('image');

//  app.post('/article/create', function(req, res){
//  		upload(req, res, function(err){
//  				if(err){
//  					res.end('Error uploading photo, please try again.');
//  				} else {
//  					res.end('Successfully uploaded photo!');
//  				}
//  		})
//  })


let env = 'development';
require('./config/database')(config[env]);
require('./config/express')(app, config[env]);
require('./config/passport')();
require('./config/routes')(app);

module.exports = app;