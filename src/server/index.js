//Import Depedencies
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var auth = require('./auth.js');
var accessDB = require('./accessDB.js');

//Connection 
var connection = null;


//Return if a user can edit
app.get('/CanEdit', function (req, res) {
    res.json(auth.checkUser(req));
});

//Get Layout
app.get('/GetLayout', function (req, res) {
    //Get the requested layout
    try {
        accessDB.getLayout(
            req.uri,
            req.version,
            connection,
            function (layout) {
                res.json(layout);
            });
    }
    catch (e) {
        res.json('ERROR : Layout Request Failed!');
    }
});

//Return if a user can edit
app.post('/SubmitLayout', function (req, res) {

    //Get the requested layout
    try {
        if (auth.checkUser(req)) {
            accessDB.updateEntry(req.body.uri,
                req.body.layout,
                req.body.version,
                auth.getIP(req),
                function () { res.json('Success: Update Applied!'); });
        }
        else {
            res.json('ERROR : You Do Not Have Valid Permissions!');
        }
    }
    catch (e) {
        res.json('ERROR : Layout Update Failed!');
    }
});


io.on('connection', function (socket) {
    console.log('A user connected');
});

http.listen(2001, function () {
    console.log('listening on *:2001');
}); 