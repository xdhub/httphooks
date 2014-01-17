var should = require('should');
var http = require('http');
var HttpHooks = require('../lib/httphooks.js');

describe('HttpHooks', function () {
    describe('#remoteHooks', function() {
        var httpServer1 = null;
        var httpHooks1 = null;
        var httpServer2 = null;
        var httpHooks2 = null;

        beforeEach(function (done) {
            httpHooks1 = new HttpHooks();
            httpHooks2 = new HttpHooks();
        });

        afterEach(function (done) {

        });

        it('should ', function () {

        });
    });
});
