
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

const dbName = 'layouts';
const r = require('rethinkdb');

function latestVersion(connection){
  r.db(dbName)
  .table('version')
  .orderBy(r.desc('key'))
  .run(connection, function(err,result){
    if (err) throw err;
    return result;
  });
}

function insert(table, data, connection, callback){
  return r.db(dbName).table(table).insert(data).run(connection,callback);
}

// Error handling?
// create a brand new entry for a uri
// data is expected to be an entire cytoscape object
function createNew(connection, uri, data, version, callback){
 
  var uriProm = insert('uri',{uri:uri},connection); 
  var graphProm = insert('graph', {graph:data}, connection);
  var verProm = insert('version',{version:version},connection);

  var createPromise = Promise.all([uriProm, graphProm, verProm]).then(ids=> {
    var uriTP = insert('uriTranslation',{uri_id:ids[0].generated_keys[0],graph_id: ids[1].generated_keys[0]}, connection);
    var uriVP = insert('versionTranslation',{graph_id:ids[1].generated_keys[0],version_id: ids[2].generated_keys[0]}, connection);
    return Promise.all([uriTP,uriVP]);
  });

  if(callback){
    createPromise.then(result=>{
      callback();
    });
  } else {
    return createPromise;
  }
}


// Find the graph id that matches the provided uri and version 
function getGraphID(uri,version,connection,callback){
  var versionMatches = r.db(dbName)
  .table('versionTranslation')
  .eqJoin('version_id',r.db(dbName).table('version'))
  .zip()
  .filter({version:version})
  .eqJoin('graph_id',r.db(dbName).table('graph'))
  .zip()
  .run(connection);

  var uriMatches = r.db(dbName)
  .table('uriTranslation')
  .eqJoin('uri_id',r.db(dbName).table('uri'))
  .zip()
  .filter({uri:uri})
  .eqJoin('graph_id', r.db(dbName).table('graph'))
  .zip()
  .run(connection);

  var graphProm = Promise.all([versionMatches,uriMatches]).then(([verCursor, uriCursor])=>{
    return Promise.all([verCursor.toArray(),uriCursor.toArray()]);
  }).then(([versions,uris])=>{
    if (versions.length === 0){
      // this shouldn't happen. Version update script should handle this connection
      throw new Error('No graphs for this version');
    }
    if (uris.length === 0){
      // this also shouldn't happen for the same reason.
      throw new Error('No graphs associated with this uri');
    }

    for (var i=0; i<uris.length; i++){
      for (var j =0; j < versions.length; j++){
        if (versions[j]['graph_id'] === uris[i]['graph_id']){
          return versions[j]['graph_id'];
        }
      }
    }
    throw new Error('No match between graphs for this set of version number and uri');
    // If there is no match then this uri hasn't been saved in this version? Shouldn't happen
  })

  if(callback){
    graphProm.then((result)=>{
      callback();
    });
  }else{
    return graphProm;
  }
}

// ----------- Submit a new layout -----------------------

function updateEntry(uri, layout, version, user, connection, callback){
  var result = getGraphID(uri,version,connection)
  .then((result)=>{
    return insert('layout',{
      graph_id:result, layout:layout, date_added: new Date(),
      flagged:false, added_by: user},
      connection);
  })

  if(callback){ 
    result.then(callback());
  } else {
    return result;
  }
}


// --------- Fake Heuristics ---------------
function runFakeHeuristics(layouts,callback){
  var layout = layouts.toArray()
  .then((result)=>{
    return result[0];
  })

  if(callback){
    callback();
  }else{
    return layout;
  }
}

// Retrieve layout from the database based on a uri and a version

function getLayout(uri, version,connection, callback){
  var layout = getGraphID(uri,version,connection)
  .then((result)=>{
    //console.log(result);
    return r.db(dbName)
    .table('layout')
    .filter({graph_id:result})
    .orderBy(r.desc('date_added'))
    .run(connection);
  })
  .then((result)=>{
    //console.log(result);
    return runFakeHeuristics(result);
  })

  
  if(callback){
    layout.then((result)=>{
      callback();
    });
  } else {
    return layout;
  }
}

module.exports = {
  getLayout: getLayout,
  updateEntry: updateEntry,
  createNew: createNew
}

