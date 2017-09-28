/*
The purpose of this script is to build the database and then populate it with XMLs from a
folder in the same directory (stored in dirs.out). This should ideally only be run once to set up
and populate the DB.

The input folder should contain XMLs where the title of each XML is something like
http___someinfo_someotherinfo_somemoreinfo.xml
*/

const r = require('rethinkdb');
const fs = require('fs'); // node file system, to be used for importing XMLs
const convert = require('sbgnml-to-cytoscape'); // used to convert to cy JSONs

// folder names for where the XMLs are located and where to
// output JSONs (outputting currently only used for debugging)
const dirs = {
  in: 'pathways-sbgn',
  out: 'pathways-json'
}

var connection = null;

r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
  if (err) throw err;
  console.log('hello' + conn);
  connection = conn;
  createTables('layouts', [
    'uri',
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
    if (enable_logs) console.log('Database '+dbName+' created.';
  });

  for (var i = 0; i < table_arr.length; i++) {
    r.db(dbName).tableCreate(table_arr[i]).run(connection, function(err, result) {
      if (err) throw err;
      if (enable_logs) console.log('Created table \''+table_arr[i]+'\'.');
    })
  }
}

fs.readdir(dirs.in, function(err, files) {
  if (err) throw err;
  fs.mkdirSync(dirs.out);
  var files_created = 0;
  var excluded_files = [];
  for (var i = 0; i < files.length; i++) {
    var curr_file = files[i];
    if (!validateURI(curr_file)) {
      excluded_files.push(curr_file);
      continue;
    }
    var curr_uri = URIify(curr_file);
    var xml_data = fs.readFileSync(dirs.in+'/'+files[i]);
    var json_data = convert(xml_data);
    json_data['uri'] = curr_uri;

    var new_filepath = dirs.out+'/'+curr_uri+'.json'
    //console.log(new_filepath)
    fs.writeFileSync(new_filepath, JSON.stringify(json_data));
    files_created++;
  }
  console.log('Created '+files_created+' files in '+dirs.out+' from '+files.length+' files in '+dirs.in+'.');
  if (excluded_files) {console.log('Excluded files:');}
  for (var i = 0; i < excluded_files.length; i++) {console.log(excluded_files[i])};
})

// Takes in a uri-to-be with and checks if it has the form
// 'http___stuff_morestuff_otherstuff'
function validateURI(uri) {
  return uri.slice(-4) === '.xml' || /^http_{3}/.test(uri);
}

// Takes in a uri-to-be with the form http___stuff_morestuff_otherstuff
// and replace all underscores with the URI characted for "/", except those
// three underscores following http
function URIify(str) {
  var str_change = str.replace(/\s/g, ''); // eliminate whitespace
  str_change = str_change.replace(/^(http)_{3}/, 'http%3A%2F%2F'); // replace http___ with uri encoded http://
  str_change = str_change.replace(/_/g, '%2F'); // replace rest of underscores with slashes
  str_change = str_change.slice(0,-4); // get rid of .xml extension
  return str_change;
}
