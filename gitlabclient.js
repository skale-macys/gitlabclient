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

    uoptions.url = (uoptions.action ? constructURL(uoptions.action) : "");

    console.log(uoptions.url);

    Object.assign(config, uconfig);
    Object.assign(options, uoptions);

    return {
        config: config,
        options: options
    };

    function constructURL(action){

        return (config.gitlab.preUrl + 
            config.gitlab.project + 
            config.gitlab.postUrl + action +
            config.gitlab.pageUrl + 
            config.gitlab.per_page);

    }
}
