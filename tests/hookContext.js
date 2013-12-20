var should = require('should');
var HookContext = require('../lib/hookContext.js');
var uuid = require('node-uuid');
var validHttpContexts = [
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {},
        responseQueue: []
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {},
        responseQueue: [ {} ]
    },
    {
        request: {
            url: '/my/:bar',
            method: 'get',
            headers: {
                'Content-Length': 1
            },
            content: ' '
        },
        response: {},
        responseQueue: [ {} ]
    }
];
var invalidHttpContexts = [
    null,
    undefined,
    {},
    {
        request: { }
    },
    {
        request: null
    },
    {
        response: { }
    },
    {
        response: null
    },
    {
        request: null,
        response: null
    },
    {
        request: null,
        response: { }
    },
    {
        request: { },
        response: null
    },
    {
        request: { },
        response: { }
    },
    {
        request: {
            url: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            method: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            headers: {}
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            headers: {}
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            method: '',
            headers: {}
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            method: '',
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            headers: {},
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {}
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: '',
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            headers: {},
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            method: '',
            headers: {},
            content: ''
        },
        response: {
            responses: []
        }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: null
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: { }
    },
    {
        request: {
            url: '',
            method: '',
            headers: {},
            content: ''
        },
        response: {
            responses: null
        }
    },
    {
        request: null,
        response: {
            responses: []
        }
    }
];
var validHooks = [
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'request-listener'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'pre-responder'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'pre-listener'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'request'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'post-listener'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'post-resonder'
    },
    {
        identifier: uuid.v4(),
        urlPatternString: '/mytopic/*',
        type: 'response-listener'
    }
];

describe('HookContext', function () {
    describe('#Constructor(value1, value2)', function () {
        it('should not throw an error whenever the first and second value is valid', function () {
            validHttpContexts.forEach(function (httpContext) {
                validHooks.forEach(function (hook) {
                    var error = false;
                    try {
                        new HookContext(httpContext, hook);
                    } catch (e) {
                        throw e;
                        error = true;
                    }

                    error.should.equal(false, 'Expected no error being thrown for item: ' + httpContext ? JSON.stringify(httpContext) : typeof httpContext);
                });
            });
        });

        it('should throw an error whenever the second value is valid but the first is not', function () {
            invalidHttpContexts.forEach(function (httpContext) {
                validHooks.forEach(function (hook) {
                    var error = false;
                    try {
                        new HookContext(httpContext, hook);
                    } catch (e) {
                        error = true;
                    }

                    error.should.equal(
                        true,
                        'Expected error being thrown for: \r\n httpContext - ' + httpContext ? JSON.stringify(httpContext) : typeof httpContext +
                        '\r\nhook - ' + hook ? JSON.stringify(hook) : typeof hook);
                });
            });
        });

        it('should have the corresponding instance properties accessible after initializing an instance', function () {
            validHttpContexts.forEach(function (httpContext) {
                validHooks.forEach(function (hook) {
                    var hookContext = new HookContext(httpContext, hook);
                    (typeof hookContext.hook).should.equal('object').should.not.be.empty;
                    (typeof hookContext.hook.identifier).should.equal('string');
                    (typeof hookContext.hook.urlPattern).should.equal('string');
                    (typeof hookContext.hook.type).should.equal('string');
                    (typeof hookContext.request).should.equal('object').should.not.be.empty;
                    (typeof hookContext.request.method).should.equal('string');
                    (typeof hookContext.request.url).should.equal('object').should.not.be.empty;
                    (typeof hookContext.request.query).should.equal('object');
                    (typeof hookContext.request.headers).should.equal('object');
                    (typeof hookContext.request.content).should.equal('string');
                    (typeof hookContext.request.json).should.equal('function');
                    var isResponder = hook.type.indexOf('responder') !== -1;
                    if (isResponder || hook.type === 'response-listener') {
                        (typeof hookContext.response).should.equal('object').should.not.be.empty;
                        if (isResponder) {
                            (typeof hookContext.setResponse).should.equal('function');
                            (typeof hookContext.response.statusCode).should.equal('number');
                            (typeof hookContext.response.headers).should.equal('object');
                            (typeof hookContext.response.content).should.equal('string');
                            (typeof hookContext.response.isSuccess).should.equal('function');
                        }
                    } else {
                        (typeof hookContext.response).should.equal('undefined');
                    }
                });
            });
        });
    });
});
