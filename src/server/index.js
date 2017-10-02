//Import Depedencies
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var auth = require('./auth.js');
var accessDB = require('./accessDB.js');
var bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var connPromise = accessDB.connect(); // returns a promise.




//Return Confirmation
app.get('/', function (req, res) {
    res.json("This Server Uses Socket.io!")
});

//Return if a user can edit
app.get('/CanEdit', function (req, res) {
    res.json(auth.checkUser(req));
});


// Get a layout and respond using socket.io
function getLayout(io, socket, ioPackage){
    //Get the requested layout
    try {
        connPromise.then((connection)=>{
            accessDB.getLayout(
                ioPackage.uri,
                ioPackage.version,
                connection,
                function (layout) {
                    io.emit('LayoutPackage', layout);
                });
        })
    }
    catch (e) {
        io.emit('error', 'error');
    }
}

// Submit a layout and respond using socket.io
function submitLayout(io, socket, ioPackage){
    //Get the requested layout
    try {
        connPromise.then((connection)=>{
            if (auth.checkUser(socket.request.connection.remoteAddress, true)) {
                accessDB.updateEntry(req.body.uri,
                    req.body.layout,
                    req.body.version,
                    connection,
                    function () { io.emit('Updated');});
            }
            else {
                io.emit('error', 'ERROR');
            }
        }).catch((e)=>{
            console.log(e);
        });
    }
    catch (e) {
        io.emit('error', 'ERROR');
    }
}


io.on('connection', function (socket) {

    //Get Layout
    socket.on('getlayout', function(ioPackage){
        getLayout(io, socket,ioPackage);
    });

     //Submit Layout
     socket.on('submitlayout', function(ioPackage){
        submitLayout(io, socket, ioPackage);
    });


});


// ------------------ Standard API Functions (Sans Socket IO) ----------------
//Get Layout
app.get('/GetLayout', function (req, res) {
    //Get the requested layout
    try {
        connPromise.then((connnection)=>{
            accessDB.getLayout(
                req.uri,
                req.version,
                connection,
                function (layout) {
                    res.json(layout);
                });
        }).catch((e)=>{
            console.log(e);
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
        connPromise.then((connection)=>{
            if (auth.checkUser(req)) {
                accessDB.updateEntry(req.body.uri,
                    req.body.layout,
                    req.body.version,
                    req.ip,
                    connection,
                    function () { res.json('Success: Update Applied!'); });
            }
            else {
                res.json('ERROR : You Do Not Have Valid Permissions!');
            }
        }).catch((e)=>{
            console.log(e);
        })
    }
    catch (e) {
        console.log(e);
        res.json('ERROR : Layout Update Failed!');
    }
});


http.listen(2001, function () {
    console.log('listening on *:2001');
});