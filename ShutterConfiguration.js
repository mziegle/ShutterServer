var fs = require("fs");

 // Get content from file
var contents = fs.readFileSync("shutterConfiguration.json");

 // Parse the configuration
var config = JSON.parse(contents);
var shutters = config.shutters;

 // Get Value from JSON
getShutterById = (id) => {

    for(var i = 0; i < shutters.length; i++){
        var shutter = shutters[i];
        if(shutter.id == id){
            return shutter;
        }
    }
}

applyOnEveryShutter = (apply) => {
    for(var i = 0; i < shutters.length; i++){
        apply(shutters[i]);
    }
}

getHostPort = () => {
    return config.host + ":" + config.port;
}

getShutters = () => {
    return shutters;
}

getShutterTransferObjects = () => {

    var shutterTransferObjects = [];

    for(var i = 0; i < shutters.length; i++){
        var shutter = shutters[i];
        shutterTransferObjects[i] = {
                "id": shutter.id,
                "name": shutter.name,
                "closingState": shutter.closingState,
            }
    }

    return shutterTransferObjects;
}

exports.getShutters = getShutters;
exports.getShutterById = getShutterById;
exports.getHostPort = getHostPort;
exports.applyOnEveryShutter = applyOnEveryShutter;
exports.getShutterTransferObjects = getShutterTransferObjects;
