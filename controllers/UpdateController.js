`
    UpdateController.js 
    Endpoint: /update

    The following endpoints update data in the Redis Database and /metadata folder
`
var express = require('express'),
    app = express(),
    config = require('config'),
    privateCredentials = require('../private_credentials/credentials.json'),
    authorization = require('../lib/authorization.js').authorization,
    database = require('../lib/database.js'),
    revision = config.revision;

// posts an announcement to the redis database
app.post('/announcements', function(req, res){
	var client = req.app.get('redis');   
    //TODO: authenticate user again
    client.get('announcements', function (err, announcements) {
        if (announcements) {
            if(announcements.length > 0){
                var parsedJSON = JSON.parse(announcements);
                var length = parsedJSON.announcements.length;
                if(length > 1){
                    parsedJSON.announcements[length] = req.body;
                    client.set("announcements", JSON.stringify(parsedJSON));
                    res.setHeader('Content-Type', 'application/json');
                    var jsonfile = require('jsonfile');
                    jsonfile.spaces = 4;
                    var path = require("path");
                    var file = path.join(__dirname, '../metadata', 'announcements.json');
                    jsonfile.writeFile(file, parsedJSON, function(err) {
                        console.error(err);
                    });
                    console.log("Successfully  updated the announcements.json file under the metadata folder.");
                    res.send(parsedJSON);
                } 
            } else{
                var announcements = {};
                announcements['announcements'] = [];
                announcements.announcements[0] = req.body;
                client.set("announcements", JSON.stringify(announcements));
                res.setHeader('Content-Type', 'application/json');
                var jsonfile = require('jsonfile');
                jsonfile.spaces = 4;
                var path = require("path");
                var file = path.join(__dirname, '../metadata', 'announcements.json');
                jsonfile.writeFile(file, announcements, function(err) {
                    console.error(err);
                });
                console.log("Successfully  updated the announcements.json file under the metadata folder.");
                res.send(announcements);
            }
        } else{
            res.sendStatus(404);
        }
    }); 
});

// updates Google Calendar data in the Redis Database
app.post('/calendar', authorization.auth, function(req, res){
    // Get access to the Google Calendar
    var google_calendar,
        google_content = privateCredentials.google_oauth;

    try{
        google_calendar = require('../services/google_calendar.js');
    } catch(err){
        console.error("Failed to loaded google calendar files...");
        return res.status(404).send("Failed to loaded google calendar files...");
    }

    google_calendar.authorize(google_content, function(err, results){
        if(!!err){
            console.error(err.reason);
            return res.status(400).send(err.reason);
        }
  
        database.setData('calendar', JSON.stringify(results), function(err){
            if(!!err){
                console.error("Error: " + err.reason);
                return res.status(400).send(err.reason);
            }
            console.log("Successully saved and cached calendar to Redis!");
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).send(results);
        });
    });
});

// Load data from the newsletter contained in views/newsletters
app.get('/newsletterload', function(req, res) {
    database.getCachedData("revisionNumber", function(err, data){
        if(!!err){
            console.error(err.reason);
        }
        revision = (!(!!err)) ? data.revision : revision;
        res.render('newsletter_load.html', {
            revision: revision 
        });
    });
});

// opens up the views/newsletters/newsletter.html page and sends it to the /newsletterload endpoint
app.get('/newsletters', function(req, res) {
    var path = require('path');
    res.sendFile(path.resolve('views/newsletters/newsletters.html'));
});

// gets called from the /newsletterload endpoint and updates the /metadata/newsletter_data.json file
app.post('/newsletterdata', function(req, res) {
    var jsonfile = require('jsonfile');
    jsonfile.spaces = 4;
    var path = require("path");
    var request = require('request');
    var fs = require("fs");
    var content = req.body.newsletter;
    var numItems = content.length;
    for (var i = 0; i < numItems; i++) {
        var download = function(uri, filename, callback) {
            request.head(uri, function(err, res, body) {
                request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
            });
        };
        
        var fileDestination = path.join(__dirname, '../public/assets/newsletter/');
        download(content[i].image, fileDestination + "newsletter" + i, function() {
        });
    }

    var file = path.join(__dirname, '../metadata', 'newsletter_data.json');
    jsonfile.writeFile(file, req.body, function(err) {
        if(err){
            console.error(err);
            res.sendStatus(400);    
            return;
        } else{
            console.log("Successfully created the newsletter_data.json file under the metadata folder.");
            res.sendStatus(200);    
            return;
        }
    });

});

// opens up the views/newsletters/newsletter.html page and sends it to the /newsletterload endpoint
app.get('/admin', authorization.auth, function(req, res) {
    database.getKeys(function(err, keys){
        if(err){
            console.error("Error: " + err.reason);
            return res.status(400).send(err.reason);
        }

        database.getCachedData("revisionNumber", function(err, data){
            if(!!err){
                console.error(err.reason);
            }
            revision = (!(!!err)) ? data.revision : revision;
            res.render('admin.html', {
                revision: revision,
                keys: keys
            });
        }); 
    });
});

app.post('/cache', function(req,res){
    var key = req && req.body && req.body.key || "";
    if(!!key){
        database.updateCache(key, function(err, response){
            if(err){
                console.error("Error: " + err.reason);
                return res.status(400).send("Error: " + err.reason);
            }
            console.log("Successfully updated local cache from Redis database.");
            res.status(200).send(response);
        });        
    } else{
        res.status(400).send("Did not provide a key");
    }
});

module.exports = app;