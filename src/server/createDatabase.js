
const fs = require('fs'); // node file system, to be used for importing XMLs
const convert = require('sbgnml-to-cytoscape'); // used to convert to cy JSONs
const update = require('./updateVersion.js');
const accessDB = require('./accessDB.js');
const Promise = require('bluebird');

const args = process.argv;

const version = args[2];
const dir = args[3] ? args[3] : './';

if (!version) throw Error ('no version provided');


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

var connectionPromise = update.connect();
var conn = null;

var excluded_files = [];


function processFile(dir,file){

  if (!validateURI(file)) {
    return;
  }

  var uri = URIify(file);
  var xml_data = fs.readFileSync(dir+'/'+file);
  var json_data = convert(xml_data);

  try {
    accessDB.createNew(uri,json_data,version,conn);

  } catch (e){
    console.log(e);
    fs.rename(dir +'/' +  file, '/Users/geoffreyelder/Desktop/Broken/' + file, function(err){
      if (err){ throw err;}
    });
  }
}

connectionPromise.then((connection)=>{
  conn = connection;  
  return update.createVersion(version,connection);

}).catch((e)=>{
  throw e;
}).then(()=>{
  if (!conn){
    throw Error ('No connection');
  }
  var numProcessed = 0;
  fs.readdir(dir, function(err, files){
    Promise.map(files,function(file){
      processFile(dir, file);
      numProcessed++;
      if(!(numProcessed%20)){
        console.log(numProcessed);
      }
    },
    {concurrency: 4});
  });
});
