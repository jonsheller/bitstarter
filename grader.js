#!/usr/bin/env node
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }
    
    return instr;
};

var coerceUrl = function(url) {
    return url.toString();
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksFile) {
    var $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksFile).sort();
    var out = {};
    for (var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

if (require.main == module) {
    program
      .option('-c, --checks <checks>', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
      .option('-f, --file <file>', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
      .option('-u, --url <url>', 'Url to download and verify', coerceUrl, URL_DEFAULT)
      .parse(process.argv);

    if (program.url) {
	rest.get(program.url).on("complete", function(data) {
	      fs.writeFileSync("download.tmp", data);
	      var checkJson = checkHtmlFile("download.tmp", program.checks);
	      var outJson = JSON.stringify(checkJson, null, 4);
	      console.log(outJson);
	    });
    } else {
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
