'use strict';

var Mocha = require('mocha')
  , fs = require('fs')
  , path = require('path');

process.env.PORT=8080;
process.env.PORT1=8080;
process.env.PORT2=8081;

var mocha = new Mocha();

fs.readdirSync('tests').filter(function(file){
  return file.substr(-3) === '.js';
})
.forEach(function(file){
  mocha.addFile(path.join('tests', file));
});

mocha.run(function(failures){
  process.exit(failures);
});
