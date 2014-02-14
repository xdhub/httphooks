//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

var should = require('should');
var Multipart = require('../lib/common/multipart.js');
var validBoundaryValues = [
    'a', '123', 'a b', '\'', '(', ')', '+',
    '_', ',', '-', '.', '/', ':', '=', '?',
    new Array(70 + 1).join('a')
];
var invalidBoundaryValues = [
    'a ', '&', '*', '\\', '!',
    new Array(69 + 1).join('a') + ' ',
    new Array(71 + 1).join('a')
];
var validSubtypeValues = [
    'mixed', 'alternative', 'digest', 'parallel'
];
var validHeaderValues = [
    { 'Content-Length': 0 },
    { 'X-MyCustomHeader': 'MyCustomValue' }
];
var validPreambleOrEpilogueValues = [
    '',
    'a',
    'this is a valid value'
];
var validPartsValues = [
    [ 'aaaaaaaaaaaaa' ],
    [ 'a', 'b' ],
    [ new Buffer('aaaaa') ],
    [ new Buffer('a'), new Buffer('b') ]
];
var nonStringTypes = [ 1, {}, [], function () {}, ];
var nonObjectTypes = [ 1, function () {}, 'asdfas' ];
var nonArrayTypes = [ 1, function () {}, {}, 'asdfasdf' ];

describe('Multipart', function () {
    describe('Validate presence of the static definition', function () {
        it('should provide a defined set of public functions', function () {
            var staticFunctions = [ 'parse' ];
            staticFunctions.forEach(function (fn) {
                var typeName = typeof Multipart[fn];
                typeName.should.equal('function', 'Expected function to be accessible: \'' + fn + '\'');
            });
        });
    });

    describe('#Constructor()', function () {
        it('should initialize correctly when no options are provided and not throw any errors', function () {
            (function () {
                new Multipart();
            }).should.not.throw();
        });

        it ('should provide the defined set of public functions', function () {
            var instanceFunctions = [
                'getBoundaryValue', 'setBoundaryValue', 'getSubtype', 'setSubtype',
                'getHeader', 'setHeader', 'getHeaders', 'getPreamble', 'setPreamble',
                'getEpilogue', 'setEpilogue', 'compose'
            ];
            var multipart = new Multipart();
            instanceFunctions.forEach(function (fn) {
                var typeName = typeof multipart[fn];
                typeName.should.equal('function', 'Expected function to be accessible: \'' + fn + '\'');
            });
        });

        it('should throw an error whenever the boundary value option property is not of the proper type', function () {
            nonStringTypes.forEach(function (boundaryValue) {
                var error = false;
                try {
                    new Multipart({ boundaryValue: boundaryValue });
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof boundaryValue);
            });
        });

        it('should throw an error whenever the subtype option property is not of the proper type', function () {
            nonStringTypes.forEach(function (subtype) {
                var error = false;
                try {
                    new Multipart({ subtype: subtype });
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof subtype);
            });
        });

        it('should throw an error whenever the headers option property is not of the proper type', function () {
            nonObjectTypes.forEach(function (headers) {
                var error = false;
                try {
                    new Multipart({ headers: headers });
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof headers);
            });
        });

        it('should throw an error whenever the preamble option property is not of the proper type', function () {
            nonStringTypes.forEach(function (preamble) {
                var error = false;
                try {
                    new Multipart({ preamble: preamble });
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof preamble);
            });
        });

        it('should throw an error whenever the epilogue option property is not of the proper type', function () {
            nonStringTypes.forEach(function (epilogue) {
                var error = false;
                try {
                    new Multipart({ epilogue: epilogue });
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof epilogue);
            });
        });

        it('should throw an error whenever the parts option property is not of the proper type', function () {
            nonArrayTypes.forEach(function (parts) {
                var error = false;
                try {
                    new Multipart({ parts: parts });
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof parts);
            });
        });

        it('should throw an error whenever the boundary value is not valid', function () {
            invalidBoundaryValues.forEach(function (boundaryValue) {
                var error = false;
                try {
                    new Multipart({ boundaryValue: boundaryValue });
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected an error being thrown for item: \'' + boundaryValue + '\'');
            });
        });

        it('should not throw an error whenever the boundary value is valid', function () {
            validBoundaryValues.forEach(function (boundaryValue) {
                var error = false;
                try {
                    new Multipart({ boundaryValue: boundaryValue });
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected no error being thrown for item: \'' + boundaryValue + '\'');
            });
        });

        it('should not throw an error whenever the subtype is valid', function () {
            validSubtypeValues.forEach(function (subtype) {
                var error = false;
                try {
                    new Multipart({ subtype: subtype });
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected no error being thrown for item: \'' + subtype + '\'');
            });
        });

        it('should not throw an error whenever the headers are valid', function () {
            validHeaderValues.forEach(function (headers) {
                var error = false;
                try {
                    new Multipart({ headers: headers });
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected no error being thrown for item: \'' + headers + '\'');
            });
        });

        it('should not throw an error whenever the preamble are valid', function () {
            validPreambleOrEpilogueValues.forEach(function (preamble) {
                var error = false;
                try {
                    new Multipart({ preamble: preamble });
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected no error being thrown for item: \'' + preamble + '\'');
            });
        });

        it('should not throw an error whenever the epilogue are valid', function () {
            validPreambleOrEpilogueValues.forEach(function (epilogue) {
                var error = false;
                try {
                    new Multipart({ epilogue: epilogue });
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected no error being thrown for item: \'' + epilogue + '\'');
            });
        });

        it('should not throw an error whenever the parts are valid', function () {
            validPartsValues.forEach(function (parts) {
                var error = false;
                try {
                    new Multipart({ parts: parts });
                } catch (e) {
                    error = true;
                }

                error.should.equal(false, 'Expected no error being thrown for item: \'' + parts + '\'');
            });
        });
    });

    describe('#getBoundaryValue()', function () {
        it('should get the provided valid boundary value', function () {
            var multipart = new Multipart({ boundaryValue: '' });
            multipart.getBoundaryValue().should.be.a.String.and.not.equal('', 'Expected value be different than: \'\'');

            validBoundaryValues.forEach(function (boundaryValue) {
                var multipart = new Multipart({ boundaryValue: boundaryValue });
                multipart.getBoundaryValue().should.be.a.String.and.equal(boundaryValue, 'Expected value: \'' + boundaryValue + '\'');
            });
        });
    });

    describe('#getSubtype()', function () {
        it('should get the provided valid subtype', function () {
            var multipart = new Multipart({ subtype: '' });
            multipart.getSubtype().should.be.a.String.and.equal('mixed', 'Expected value be different than: \'\'');

            validSubtypeValues.forEach(function (subtype) {
                var multipart = new Multipart({ subtype: subtype });
                multipart.getSubtype().should.be.a.String.and.equal(subtype, 'Expected value: \'' + subtype + '\'');
            });
        });
    });

    describe('#getHeader(value)', function () {
        it('should get the provided valid header', function () {
            validHeaderValues.forEach(function (headers) {
                var multipart = new Multipart({ headers: headers });
                for (var propertyName in headers) {
                    multipart.getHeader(propertyName).should.equal(
                        headers[propertyName],
                        'Expected value \'' + headers[propertyName] + '\' for property \'' + propertyName + '\'');
                }
            });
        });
    });

    describe('#getHeaders()', function () {
        it('should get the provided valid headers', function () {
            validHeaderValues.forEach(function (headers) {
                var multipart = new Multipart({ headers: headers });
                multipart.getHeaders().should.eql(headers);
            });
        });
    });

    describe('#getPreamble()', function () {
        it('should get the provided valid preamble', function () {
            validPreambleOrEpilogueValues.forEach(function (preamble) {
                var multipart = new Multipart({ preamble: preamble });
                var actualPreamble = multipart.getPreamble();
                should.strictEqual(preamble, actualPreamble);
            });
        });
    });

    describe('#getEpilogue()', function () {
        it('should get the provided valid epilogue', function () {
            validPreambleOrEpilogueValues.forEach(function (epilogue) {
                var multipart = new Multipart({ epilogue: epilogue });
                var actualEpilogue = multipart.getEpilogue();
                should.strictEqual(epilogue, actualEpilogue);
            });
        });
    });

    describe('#setBoundaryValue(value)', function () {
        it('should set the provided valid boundary value', function () {
            validBoundaryValues.forEach(function (boundaryValue) {
                var multipart = new Multipart();
                multipart.setBoundaryValue(boundaryValue);
                multipart.getBoundaryValue().should.be.a.String.and.equal(boundaryValue, 'Expected value: \'' + boundaryValue + '\'');
            });
        });

        it('should throw an error whenever the boundary value is not of the proper type', function () {
            nonStringTypes.forEach(function (boundaryValue) {
                var error = false;
                var multipart = new Multipart();
                try {
                    multipart.setBoundaryValue(boundaryValue);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof boundaryValue);
            });
        });

        it('should throw an error whenever the boundary value is not of the proper type', function () {
            invalidBoundaryValues.forEach(function (boundaryValue) {
                var error = false;
                var multipart = new Multipart();
                try {
                    multipart.setBoundaryValue(boundaryValue);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected an error being thrown for item: \'' + boundaryValue + '\'');
            });
        });
    });

    describe('#setSubtype()', function () {
        it('should set the provided valid subtype', function () {
            validSubtypeValues.forEach(function (subtype) {
                var multipart = new Multipart();
                multipart.setSubtype(subtype);
                multipart.getSubtype().should.be.a.String.and.equal(subtype, 'Expected value: \'' + subtype + '\'');
            });
        });

        it('should throw an error whenever the subtype is not of the proper type', function () {
            nonStringTypes.forEach(function (subtype) {
                var error = false;
                var multipart = new Multipart();
                try {
                    multipart.setSubtype(subtype);
                } catch (e) {
                    error = true;
                }

                error.should.equal(true, 'Expected throw for item of type: ' + typeof subtype);
            });
        });
    });

    describe('#setHeader(value1, value2)', function () {
        it('should set the provided valid header', function () {
            validHeaderValues.forEach(function (headers) {
                var multipart = new Multipart();
                for (var propertyName in headers) {
                    multipart.setHeader(propertyName, headers[propertyName]);
                    multipart.getHeader(propertyName).should.equal(
                        headers[propertyName],
                        'Expected value \'' + headers[propertyName] + '\' for property \'' + propertyName + '\'');
                }

                multipart.getHeaders().should.eql(headers);
            });
        });
    });

    describe('#setPreamble(value)', function () {
        it('should get the provided valid preamble', function () {
            validPreambleOrEpilogueValues.forEach(function (preamble) {
                var multipart = new Multipart();
                multipart.setPreamble(preamble);
                var actualPreamble = multipart.getPreamble();
                should.strictEqual(preamble, actualPreamble);
            });
        });
    });

    describe('#setEpilogue(value)', function () {
        it('should get the provided valid preamble', function () {
            validPreambleOrEpilogueValues.forEach(function (epilogue) {
                var multipart = new Multipart();
                multipart.setEpilogue(epilogue);
                var actualEpilogue = multipart.getEpilogue();
                should.strictEqual(epilogue, actualEpilogue);
            });
        });
    });

    describe('#compose()', function () {
        it('should construct valid headers and content', function () {
            var options = {
                boundaryValue: 'b',
                parts: ['a']
            };
            var multipart = new Multipart(options);
            var result = multipart.compose();
            var expectedContentString =
                '\r\n--b\r\n' +
                'a' +
                '\r\n--b--\r\n';
            var expectedHeaders = {
                'Content-Type': 'multipart/mixed; boundary=b',
                'Content-Length': new Buffer(expectedContentString).length
            };
            result.headers.should.eql(expectedHeaders);
            result.content.toString().should.equal(expectedContentString);
        });

        it('should construct valid headers and content (with preamble and eplilogue)', function () {
            var options = {
                subtype: 'parallel',
                boundaryValue: 'mYBounDarY 1234567890',
                preamble: 'preamble wha wha wha',
                parts: ['Part 1', 'Part 2', 'Part 3'],
                epilogue: 'epilogue some other things'
            };
            var multipart = new Multipart(options);
            var result = multipart.compose();
            var expectedContentString =
                'preamble wha wha wha' + 
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Part 1' +
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Part 2' +
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Part 3' +
                '\r\n--mYBounDarY 1234567890--\r\n' +
                'epilogue some other things';
            var expectedHeaders = {
                'Content-Type': 'multipart/parallel; boundary=mYBounDarY 1234567890',
                'Content-Length': new Buffer(expectedContentString).length
            };
            result.headers.should.eql(expectedHeaders);
            result.content.toString().should.equal(expectedContentString);
        });
    });

    describe('#parse(value1, value2)', function () {
        it('should construct valid headers and content ', function () {
            var content =
                '\r\n--b\r\n' +
                'a' +
                '\r\n--b--\r\n';
            var headers = {
                'Content-Type': 'multipart/mixed; boundary=b',
                'Content-Length': new Buffer(content).length
            };
            var expectedOptions = {
                subtype: 'mixed',
                boundaryValue: 'b',
                headers: headers,
                preamble: null,
                parts: ['a'],
                epilogue: null
            };
            var options = Multipart.parse(headers, content);
            options.should.eql(expectedOptions);
        });

        it('should construct valid headers and content (with preamble and eplilogue)', function () {
            var content =
                'preamble wha wha wha' + 
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Part 1' +
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Part 2' +
                '\r\n--mYBounDarY 1234567890\r\n' +
                'Part 3' +
                '\r\n--mYBounDarY 1234567890--\r\n' +
                'epilogue some other things';
            var headers = {
                'Content-Type': 'multipart/parallel; boundary=mYBounDarY 1234567890',
                'Content-Length': new Buffer(content).length
            };
            var expectedOptions = {
                subtype: 'parallel',
                boundaryValue: 'mYBounDarY 1234567890',
                headers: headers,
                preamble: 'preamble wha wha wha',
                parts: ['Part 1', 'Part 2', 'Part 3'],
                epilogue: 'epilogue some other things'
            };
            var options = Multipart.parse(headers, content);
            options.should.eql(expectedOptions);
        });
    });
});
