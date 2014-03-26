//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// THIS CODE IS PROVIDED ON AN  *AS IS* BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT
// LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR
// A PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
//
// See the Apache Version 2.0 License for specific language governing
// permissions and limitations under the License.
//

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
