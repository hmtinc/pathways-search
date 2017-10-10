
/*
TODO:
- create a file for the 'heuristics'. It doesn't belong here
- create a separate functions for getGraph and getLayout
    some users might not want both and those who do can bundle themselves
- go over error handling and create meaningful failure messages and mechanisms
- clean up auxillary test files and move them into mocha/chai
- create a queryRoot function?
*/

const dbName = 'layouts';
const r = require('rethinkdb');
const uuid = require('uuid/v4');


// Convenience generic insert function for inserting a json (data)
// into the table specified by table
function insert(table, data, connection, callback) {
  return r.db(dbName).table(table).insert(data).run(connection, callback);
}

// Convenience function to handle the result of an asynchronous call with
// an optional callback and a returned promise if none is given.
function handleResult(resultPromise, callback){
  if (callback) {
    resultPromise.then(result => {
      callback(result);
    }).catch((e) => {
      throw e;
    });
  } else {
    return resultPromise;
  } 
}

// create a database entry for a graph object. No default layout is
// stored. pcID is expected to be the pathway commons uri, data the 
// graph object and release the version of pathway commons associated
// with all this data.
function createNew(pcID, data, release, connection, callback) {

  // Insert the graph object. 
  // this try block exists to help me understand the behaviour
  // of the 8 misbehaving files.
  try {
    var graphID = uuid();
    var createPromise = insert('graph', { id: graphID, graph: data }, connection);
  } catch (e) {
    throw e;
  }

  createPromise.then(() => {
    // Create the version id map row. Connects the entry point (PC_id + release_id) to the graph and its layouts
    return insert('version', { id: uuid(), pc_id: pcID, graph_id: graphID, release_id: release, layout_ids: [] }, connection);
  }).catch((e) => {
    throw e;
  });

  // Once this is done either return the promise or run the callback.
  return handleResult(createPromise, callback);
}

/*
getGraphID(pcID, releaseID, connection [,callback])
returns the database uuid for the graph specified by the provided
pathway commons identifier and release version (releaseID).

pass relaseID = 'latest' to receive the identifier for the most recent
version of PC.
*/
function getGraphID(pcID, releaseID, connection, callback) {
  // Two options for the query root depending on if releaseID is specified or 'latest' is used
  // if latest: order the version rows matching the pcid and take the highest version
  const latestQuery = r.db(dbName).table('version').filter({ pc_id: pcID }).orderBy('release_id').limit(1);
  // if specified: filter done by release_id instead of ordering.
  const specificQuery = r.db(dbName).table('version').filter({ pc_id: pcID }).filter({ release_id: releaseID });

  // set the generic root for ease of use throughout the function.
  var queryRoot = (releaseID === 'latest') ? latestQuery : specificQuery;

  // The result of both of these queries will always be a cursor of length one
  // (once proper databse instantiation is complete)
  // Convert this cursor to an array then grab the first (and only) entries uuid
  var idPromise = queryRoot.run(connection)
    .then((result) => {
      return result.toArray();
    }).catch((e) => {
      throw e;
    }).then((result) => {
      return result[0].graph_id;
    }).catch(() => {
      return null;
    });


  return handleResult(idPromise, callback);
}


// ----------- Submit a new layout -----------------------
/*
saveLayout(pcID, layout, releaseID, connection [,callback]) 
saves a new layout for the graph version specfied by the given pc id and release id.

Accepts 'latest' as a valid releaseID
*/
function saveLayout(pcID, layout, releaseID, connection, callback) {
  // Two options for the query root depending on if releaseID is specified or 'latest' is used
  // if latest: order the version rows matching the pcid and take the highest version
  const latestQuery = r.db(dbName).table('version').filter({ pc_id: pcID }).orderBy('release_id').limit(1);
  // if specified: filter done by release_id instead of ordering.
  const specificQuery = r.db(dbName).table('version').filter({ pc_id: pcID }).filter({ release_id: releaseID });

  // set the generic root for ease of use throughout the function.
  var queryRoot = (releaseID === 'latest') ? latestQuery : specificQuery;


  // Create the new layout entry in the database
  var layoutID = uuid();
  var result = insert('layout', { id: layoutID, positions: layout, date_added: r.now() }, connection)
    .then(() => {
      // Find the related version row and store the layout_id so that it may be accessed.
      queryRoot.update({ layout_ids: r.row('layout_ids').append(layoutID) })
        .run(connection);
    }).catch(() => {
      return null;
    });

  if (!result) {
    throw Error('Failed insertion');
  }

  return handleResult(result, callback);
}



// ------------------- Get a layout -----------------------
/*
getLayout(pcID, releaseID, connection [,callback]) 
Retrieve the layout and its associated graph from the database for the 
Entry specficed by the tuple of pcID and releaseID.

Accepts 'latest' as a valid releaseID
*/
function getLayout(pcID, releaseID, connection, callback) {
  // Two options for the query root depending on if releaseID is specified or 'latest' is used
  // if latest: order the version rows matching the pcid and take the highest version
  const latestQuery = r.db(dbName).table('version').filter({ pc_id: pcID }).orderBy('release_id').limit(1);
  // if specified: filter done by release_id instead of ordering.
  const specificQuery = r.db(dbName).table('version').filter({ pc_id: pcID }).filter({ release_id: releaseID });

  // set the generic root for ease of use throughout the function.
  var queryRoot = (releaseID === 'latest') ? latestQuery : specificQuery;


  // Extract a list of layouts associated with the version from the database
  var layout = queryRoot
    .run(connection)
    .then((cursor) => {
      return cursor.toArray(); // Convert list of valid versions (should be only 1)
    }).catch((e) => {          // from a cursor to an array
      throw e;
    }).then((versionArray) => {
      // join the layouts to their layout ids 
      return r.expr(versionArray[0].layout_ids) // create a rethink expression from list of ids
        .eqJoin((id) => { return id; }, r.db(dbName).table('layout'))
        .zip()
        .pluck('positions') // We're only looking for positions
        .run(connection);
    }).catch((e) => {
      throw e;
    }).then((allSubmissions) => {
      // Run decision making process to almagamate down to one layout to return
      // currently just returns the most recent submission
      return runFakeHeuristics(allSubmissions);
    }).catch((e) => {
      throw e;
    });

  // Extract the graph as well. Maybe this should be its own function
  var graph = queryRoot
    .eqJoin('graph_id', r.db(dbName).table('graph'))
    .zip()
    .pluck('graph')
    .run(connection)
    .then((cursor) => {
      return cursor.toArray();
    }).catch((e) => {
      throw e;
    }).then((array) => {
      return array[0];
    });

  // Package the combined results together to return
  var data = Promise.all([layout, graph])
    .then(([layout, graph]) => {
      return { layout: layout ? layout.positions : null, graph: graph.graph };
    }).catch(() => {
      throw Error('Error: data could not be retrieved');
    });

  // handle callback/promise decision
  handleResult(data,callback);
}

// returns a promise for a connection to the database.
function connect() {
  return r.connect({ host: 'localhost', port: 28015 });
}


// --------- Fake Heuristics ---------------
// This should probably go in its own file
function runFakeHeuristics(layouts, callback) {
  var layout = layouts.toArray()
    .then((result) => {
      return result[0];
    }).catch(function (e) {
      throw e;
    });

  if (callback) {
    callback();
  } else {
    return layout;
  }
}

module.exports = {
  connect: connect,
  getLayout: getLayout,
  getGraphID: getGraphID,
  saveLayout: saveLayout,
  createNew: createNew
};
