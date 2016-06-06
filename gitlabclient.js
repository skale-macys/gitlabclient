// git client set up and config


var exports = module.exports = {};
var config, options;

exports.setup = function(uconfig, uoptions) {
    var fs = require( "fs" );
    config = JSON.parse(fs.readFileSync('config.json'));
    options = {
        url: "",
        headers: config[ "headers" ]
    };

    Object.assign(config, uconfig);
    Object.assign(options, uoptions);

    return {
        config: config,
        options: options
    };
}
