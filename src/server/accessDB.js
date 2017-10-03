
/*
- userFunctions
  - correctCredentials(username, password)
  - createUser(username, passwords, permissions) 
*/

const dbName = 'layouts';
const r = require('rethinkdb');


// This funciton needs to be beefed up.
// What if the the graph in question doesn't exist in the newest version???
// How are these things really being organized?
function latestVersion(connection){
  return r.db(dbName)
  .table('version')
  .orderBy(r.desc('version'))
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
// this function is awful...
function createNew(uri, data, version, connection, callback){
 
  var uriProm = insert('uri',{uri:uri},connection); 
  var graphProm = insert('graph', {graph:data}, connection);
  var verProm = insert('version',{version:version},connection);

  var createPromise = Promise.all([uriProm, graphProm, verProm]).then(ids=> {
    var uriTP = insert('uriTranslation',{uri_id:ids[0].generated_keys[0],graph_id: ids[1].generated_keys[0]}, connection);
    var uriVP = insert('versionTranslation',{graph_id:ids[1].generated_keys[0],version_id: ids[2].generated_keys[0]}, connection);
    return Promise.all([uriTP,uriVP]);
  }).catch((e)=>{
    throw e;
  });

  if(callback){
    createPromise.then(result=>{
      callback(result);
    }).catch((e)=>{
      throw e;
    });
  } else {
    return createPromise;
  }
}

function compVersions(ver1, ver2){
  if (!ver2) return ver1;

  return (ver1 > ver2); // To be ammended
}

function getLatestID (uriGraphs, connection, callback){
  var versionPivots = r.db(dbName)
  .table('versionTranslation')
  .eqJoin('version_id',r.db(dbName).table('version'))
  .zip()
  .eqJoin('graph_id',r.db(dbName).table('graph'))
  .zip()
  .run(connection); 

  var latestID = versionPivots.then((cursor)=>{
    return cursor.toArray();
  }).catch((e)=>{
    throw e;
  }).then((versionGraphs)=>{
    if (versionGraphs.length === 0){
      // this shouldn't happen. Version update script should handle this connection
      throw new Error('No versions at all');
    }
    if (uriGraphs.length === 0){
      // this also shouldn't happen for the same reason.
      throw new Error('No graphs associated with this uri');
    }

    var highestVersion = null;
    var curAnswer = null;
    for (var i=0; i<uriGraphs.length; i++){
      for (var j =0; j < versionGraphs.length; j++){
        if (versionGraphs[j]['graph_id'] === uriGraphs[i]['graph_id']){
          if (compVersions(versionGraphs[j].version,highestVersion)){
            highestVersion = versionGraphs[j].version;
            curAnswer = versionGraphs[j].graph_id;
          }
        }
      }
    }
    return curAnswer;
  }).catch(()=>{
    return null;
  });

  if (!latestID){
    throw Error ('There are no version identifiers for this graph'); // This should never be possible
  }

  if(callback){
    latestID.then((result)=>{
      callback(result);
    }).catch((e)=>{
      throw e;
    });
  } else {
    return latestID;
  }
}

function getSpecificVer(uriGraphs,version,connection,callback){
  var versionPivots = r.db(dbName)
  .table('versionTranslation')
  .eqJoin('version_id',r.db(dbName).table('version'))
  .zip()
  .filter({version:version})
  .eqJoin('graph_id',r.db(dbName).table('graph'))
  .zip()
  .run(connection); 

  var graphID = versionPivots.then((cursor)=>{
    return cursor.toArray();
  }).catch((e)=>{
    throw e;
  }).then((versionGraphs)=>{
    if (versionGraphs.length === 0){
      // this shouldn't happen. Version update script should handle this connection
      throw new Error('No versions at all');
    }
    if (uriGraphs.length === 0){
      // this also shouldn't happen for the same reason.
      throw new Error('No graphs associated with this uri');
    }

    for (var i=0; i<uriGraphs.length; i++){
      for (var j =0; j < versionGraphs.length; j++){
        if (versionGraphs[j]['graph_id'] === uriGraphs[i]['graph_id']){
          return versionGraphs[j]['graph_id'];
        }
      }
    }
    throw new Error('No match between graphs for this set of version number and uri');
   
  }).catch(()=>{
    return null;
  });

  if (!graphID){
    throw Error ('There are no version identifiers for this graph'); // This should never be possible
  }

  if(callback){
    graphID.then((result)=>{
      callback(result);
    }).catch((e)=>{
      throw e;
    });
  } else {
    return graphID;
  }  
}

function getGraphID (uri, version, connection,callback){
  var uriMatches = r.db(dbName)
  .table('uriTranslation')
  .eqJoin('uri_id',r.db(dbName).table('uri'))
  .zip()
  .filter({uri:uri})
  .eqJoin('graph_id', r.db(dbName).table('graph'))
  .zip()
  .run(connection);

   // This is different
  
  var graphProm = uriMatches.then((cursor)=>{
    return cursor.toArray();
  }).catch((e)=>{
    throw e;
  }).then ((uriGraphs)=>{
    if(version === 'latest'){
      return getLatestID(uriGraphs,connection);
    } else {
      return getSpecificVer(uriGraphs,version,connection);
    }
  }).catch((e)=>{
    throw e;
  });

  if(!graphProm){
    return null;
  }

  if(callback){
    graphProm.then((result)=>{
      callback(result);
    }).catch(function(e){
      throw e;
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
  }).catch(function(){
    return null;
  });

  if (!result){
    throw Error ('Failed insertion');
  }

  if(callback){ 
    result.then(callback())
    .catch(function(e){
      throw e;
    });
  } else {
    return result;
  }
}


// --------- Fake Heuristics ---------------
function runFakeHeuristics(layouts,callback){
  var layout = layouts.toArray()
  .then((result)=>{
    return result[0];
  }).catch(function(e){
    throw e;
  });

  if(callback){
    callback();
  }else{
    return layout;
  }
}

// Retrieve layout from the database based on a uri and a version
// Must return the graph object and its layout
function getLayout(uri, version,connection, callback){

  var layout = getGraphID(uri,version,connection)
  .then((result)=>{
    var layouts =  r.db(dbName)
    .table('layout')
    .filter({graph_id:result})
    .orderBy(r.desc('date_added'))
    .run(connection);

    var graphObj = r.db(dbName)
    .table('graph')
    .filter({id:result})
    .limit(1) // lazy search
    .run(connection);

    return Promise.all([layouts,graphObj]);
  }).catch((e)=>{
    throw e;
  })
  .then(([layouts,graph])=>{
    return Promise.all([runFakeHeuristics(layouts),graph.toArray()]);
  }).catch((e)=>{
    throw e;
  })
  .then(([layout, graph])=>{
    return {layout: layout.layout, graph: graph[0].graph};
  }).catch(()=>{
    return null;
  });

  if (!layout) throw Error ('No layout to be had');
  
  if(callback){
    layout.then((result)=>{
      callback(result);
    }).catch((e)=>{
      throw e;
    });
  } else {
    return layout;
  }
}

// returns a promise for a connection to he database.
function connect(){
  return r.connect( {host: 'localhost', port: 28015});
}

module.exports = {
  connect: connect,
  getLayout: getLayout,
  getGraphID: getGraphID,
  updateEntry: updateEntry,
  createNew: createNew
};

