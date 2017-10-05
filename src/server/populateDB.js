/*
The purpose of this script is to populate the database with XMLs from the specified input folder
of initial layouts extracted from pathway commons. Currently this script saves the layouts to the out folder.
This should ideally only be run once to set up and populate the DB.

The input folder should contain XMLs where the title of each XML is something like
http___someinfo_someotherinfo_somemoreinfo.xml
*/

const fs = require('fs'); // node file system, to be used for importing XMLs
const convert = require('sbgnml-to-cytoscape'); // used to convert to cy JSONs
const update = require('./updateVersion.js');
var ProgressBar = require('progress');

const args = process.argv;

const version = args[2];
const dir = args[3] ? args[3] : './';

if (!version) throw Error ('no version provided');

console.log(version);
console.log(dir);

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

connectionPromise.then((connection)=>{
  conn = connection;  
  return update.createVersion(version,connection);

}).catch((e)=>{
  throw e;
}).then(()=>{
  if (!conn){
    throw Error ('No connection');
  }

  
  fs.readdir(dir, function(err, files) {
    var bar = new ProgressBar('[:bar] :percent :eta', {
      total: files.length,
      width: 20,
      stream: process.stderr
    });

    if (err) throw err;
  
    var files_created = 0;
    var excluded_files = [];
    
  
    for (var i = 0; i < files.length; i++) {

      var curr_file = files[i];
      if (!validateURI(curr_file)) {
        excluded_files.push(curr_file);
        bar.tick()
        continue;
      }
      var curr_uri = URIify(curr_file);
      var xml_data = fs.readFileSync(dir+'/'+files[i]);
      var json_data = convert(xml_data);
      bar.tick(1);
      //console.log(bar.curr);
      if (bar.complete){
        console.log('\ncomplete\n');
      }

      //console.log(files_created, ' :', curr_uri);
      if (!(i%50)){
        console.log('Processing file: ' + i);
      }

      try {
        update.updateVersionEntry(curr_uri,json_data,version,conn);
      } catch (e){
        console.log(curr_file);
        fs.rename(dir +'/' +  curr_file, '/Users/geoffreyelder/Desktop/Broken/' + curr_file, function(err){
          if (err){ throw err;}
        });
        console.log(files_created + ' : ' + curr_uri);
      }

      files_created++;
      //json_data['uri'] = curr_uri;
  
      //update.updateVersionEntry(curr_uri,json_data,version,connection)
    } 
    console.log('Created '+files_created+' files in database from '+files.length+' files in '+dir+'.');
    if (excluded_files) {console.log('Excluded files:');}

    for (var i = 0; i < excluded_files.length; i++) {console.log(excluded_files[i]);}
  });
});


