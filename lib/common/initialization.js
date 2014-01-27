function createGetterFunction(properties, propertyName) {
    return function () {
        return properties[propertyName];
    };
}

var initializeGetterProperties = function (that, defaultProperties, properties) {
    for (var propertyName in defaultProperties) {
        properties[propertyName] = !properties[propertyName]
            ? defaultProperties[propertyName]
            : properties[propertyName];
        that.__defineGetter__(propertyName, createGetterFunction(properties, propertyName));
    }
};

module.exports = {
    initializeGetterProperties: initializeGetterProperties
}
