var hookFn = function (hookContext, done) {
    done();
};

var noMatchFn = function (httpContext) {
};

module.exports = {
    hookFn: hookFn,
    noMatchFn: noMatchFn
};
