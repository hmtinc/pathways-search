/*
The purpose of this script is to build the database. This should ideally only be run once to set up
and populate the DB.
*/

const r = require('rethinkdb');

var connection = null;

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
  if (err) throw err;
  console.log('hello' + conn);
  connection = conn;
  createTables('layouts', [
    'uri',
    'uriTranslation',
    'graph',
    'versionTranslation',
    'version',
    'layout',
    'user'
  ], true);
})


function createTables(dbName, table_arr, enable_logs){
  r.dbCreate(dbName).run(connection, function(err,callback){
    if (err) throw err;
    if (enable_logs) console.log('Database '+dbName+' created.');
  });

  for (var i = 0; i < table_arr.length; i++) {
    r.db(dbName).tableCreate(table_arr[i]).run(connection, function(err, result) {
      if (err) throw err;
      
    })
  }
  if (enable_logs) console.log('Tables created.');
  
}