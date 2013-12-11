var hookFn = function (hookContext, done) {
    done();
};

var noMatchFn = function (httpContext, done) {
    done();
};

module.exports = {
    hookFn: hookFn,
    noMatchFn: noMatchFn
};
