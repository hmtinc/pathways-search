// Test srcipt for accessDB.js

const db = require ('./accessDB.js');
const r = require('rethinkdb');
var connection = null;

r.connect({host:'localhost', port:28015})
.then(function(conn){
  connection = conn;
  return Promise.all([
    // pcid, data, release, connection
    db.createNew('2','I am a graph','9',connection),
    db.createNew('3','also a graph','9',connection),
    db.createNew('2','new version', '10', connection)

  ]);
}).then(()=>{
  return Promise.all([
    // pcid, layout, release, connection
    db.saveLayout('2','bob','9',connection),
    db.saveLayout('3','test','9',connection),
    db.saveLayout('2','bollocks', 'latest', connection)
  ]);
}).then(()=>{
  return Promise.all([
    db.getLayout('2','9',connection),
    db.getLayout('3','9', connection),
    db.getLayout('2', 'latest', connection),
    db.getGraphID('2','latest',connection)
  ]);
}).then((result)=>{
  console.log(result);
})
