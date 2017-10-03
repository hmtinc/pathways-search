/*
The purpose of this script is to populate the database with XMLs from the specified input folder
of initial layouts extracted from pathway commons. Currently this script saves the layouts to the out folder.
This should ideally only be run once to set up and populate the DB.

The input folder should contain XMLs where the title of each XML is something like
http___someinfo_someotherinfo_somemoreinfo.xml
*/

const fs = require('fs'); // node file system, to be used for importing XMLs
const convert = require('sbgnml-to-cytoscape'); // used to convert to cy JSONs

const args = process.argv;

const dirs = {
  in: args[2] ? args[2] : './', 
};
dirs.out = args[3] ? args[3] : dirs.in;

console.log(dirs);

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

fs.readdir(dirs.in, function(err, files) {
  if (err) throw err;

  var files_created = 0;
  var excluded_files = [];

  // Create the write directory if needed.
  if (!fs.existsSync(dirs.out)){
    fs.mkdirSync(dirs.out);
  }

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

