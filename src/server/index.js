//Import Depedencies
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var auth = require('./auth.js');
var accessDB = require('./accessDB.js');
var bodyParser = require('body-parser');
var qs = require('query-string');
var jwt = require('express-jwt');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));



app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});

var connPromise = accessDB.connect(); // returns a promise.




//Return Confirmation
app.get('/', function (req, res) {
  res.json('This Server Uses Socket.io!');
});

//Return if a user can edit
app.get('/CanEdit', function (req, res) {
  res.json(auth.checkUser(req));
});


// Get a layout and respond using socket.io
function getLayout(io, socket, ioPackage) {
  //Get the requested layout
  try {
    connPromise.then((connection) => {
      accessDB.getLayout(
        ioPackage.uri,
        ioPackage.version,
        connection,
        function (layout) {
          io.emit('LayoutPackage', layout);
        });
    });
  }
  catch (e) {
    io.emit('error', 'error');
  }
}

// Submit a layout and respond using socket.io
function submitLayout(io, socket, ioPackage) {
  //Get the requested layout
  try {
    connPromise.then((connection) => {
      if (auth.checkUser(socket.request.connection.remoteAddress, true)) {
        accessDB.updateEntry(req.body.uri,
          req.body.layout,
          req.body.version,
          connection,
          function () { io.emit('Updated'); });
      }
      else {
        io.emit('error', 'ERROR');
      }
    }).catch((e) => {
      throw e;
    });
  }
  catch (e) {
    io.emit('error', 'ERROR');
  }
}


io.on('connection', function (socket) {

  //Get Layout
  socket.on('getlayout', function (ioPackage) {
    getLayout(io, socket, ioPackage);
  });

  //Submit Layout
  socket.on('submitlayout', function (ioPackage) {
    submitLayout(io, socket, ioPackage);
  });


});


// ------------------ Standard API Functions (Sans Socket IO) ----------------
//Get Layout
app.get('/GetLayout', function (req, res) {
  //Get the requested layout
  try {
    connPromise.then((connection) => {
      accessDB.getLayout(
        req.query.uri,
        req.query.version,
        connection,
        function (layout) {
          if (!layout) {
            res.json('Nothing to show.');
          } else {
            res.json(layout);
          }
        });
    }).catch((e) => {
      throw e;
    });
  }
  catch (e) {
    res.json('ERROR : Layout Request Failed!');
  }
});

app.get('/GetEditKey', function(req,res){
  
  try{
    connPromise.then((connection)=> {
      if (auth.checkUser(req)){
        accessDB.getGraphID(
          req.query.uri,
          req.query.version,
          connection,
          function(result){res.json(result);});
      } else {
        res.json('ERROR: Non-authenticated user');
      }
    })
  }
  catch (e) {
    res.json('ERROR: Edit Key Request Failed');
    throw e;
  }
});

app.get('/CheckEditKey', function(req,res){
  try{
    connPromise.then((connection)=>{
      accessDB.getGraphID(
        req.query.uri,
        req.query.version,
        connection,
        function(result){ res.json(result === req.query.key);}
      );
    });
  } catch (e){
    res.json('ERROR : Edit Priviliges Chech Failed');
    throw e;
  }
});

//Return if a user can edit
app.post('/SubmitLayout', function (req, res) {
  //Get the requested layout
  try {
    connPromise.then((connection) => {
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
    }).catch((e) => {
      throw e;
    });
  }
  catch (e) {
    res.json('ERROR : Layout Update Failed!');
    throw e;
  }
});


http.listen(2001, function () {
  console.log('listening on *:2001');
});