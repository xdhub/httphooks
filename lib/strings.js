var endsWith = function (str, terminator) {
    if (typeof str !== 'string') {
        throw new TypeError('Invalid string type: expected a string');
    }

    if (typeof terminator !== 'string') {
        throw new TypeError('Invalid terminator type: expected a string');
    }

    return str.indexOf(terminator, str.length - terminator.length) !== -1;
};

module.exports = {
    endsWith: endsWith
};
