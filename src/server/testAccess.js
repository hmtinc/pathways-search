// Test srcipt for accessDB.js

const db = require ('./accessDB.js');
const r = require('rethinkdb');
var connection = null;

r.connect({host:'localhost', port:28015})
.then(function(conn){
  connection = conn;
  return Promise.all([
    db.updateEntry('2','bob','10.10.10','billy',connection),
    db.updateEntry('2','test','9.9.9','admin',connection)
  ]);
}).then((result)=>{
  return db.getLayout('2','9.9.9',connection);
}).then((result)=>{
  console.log(result);
});
