
/*
Functions to write:
- createNew (uri, layout)
- getFromURI (uri [, version]) //defaults to latest version 
- updateLayout(uri, layout [, version]) // defaults to latest version
- latestVersion()
- 
- userFunctions
  - correctCredentials(username, password)
  - createUser(username, passwords, permissions) 
*/

const r = require('rethinkdb');

function latestVersion(connection){
  r.db('layouts')
  .table('version')
  .orderBy(r.desc('key'))
  .run(connection, function(err,result){
    if (err) throw err;
    return result;
  });
}

function createNew(connection, uri, data, version, callback){
 
  var uriProm = r.db('layouts')
  .table('uri')
  .insert({uri: uri})
  .run(connection);

  var graphProm = r.db('layouts')
  .table('graph')
  .insert({graph:data})
  .run(connection);

  var verProm = r.db('layouts')
  .table('version')
  .insert({version:version})
  .run(connection);

  Promise.all([uriProm, graphProm, verProm]).then(ids=> {
    r.db('layouts')
    .table('uriTranslation')
    .insert({uri_id: ids[0], graph_id: ids[1]})
    .run(connection)

    r.db('layouts')
    .table('versionTranslation')
    .insert({graph_id:ids[1],version_id: ids[2]})
    .run(connection);

    
    console.log(values);    
  });
}

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
  if (err) throw err;
  console.log('hello' + conn);
  connection = conn;
  createNew(connection,'test', 'blah', '0.0.0')

});