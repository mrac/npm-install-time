'use strict';

/**
 * Search for recent release dates of npm packages.
 *
 * Example usage:
 *
 * > node npm-install-time.js gulp-angular-templatecache 5
 *
 * That lists all packages that are dependencies of 'gulp-angular-templatecache' released within last 5 days (3 days by default).
 *
 *
 * > node npm-install-time.js 1
 *
 * Lists all packages released today or yesterday (3 days by default).
 *
 */

var fs = require('fs');
var execSync = require('child_process').execSync;
var args = process.argv.slice(2);

var DEFAULT_DAYS = 3;
var packageName = isNaN(args[0]) ? args[0] : null;
var days = args[1] || (!isNaN(args[0]) ? args[0] : DEFAULT_DAYS);

var fromDate = new Date(Date.now()-1000*60*60*24*days).toISOString().substr(0,10);

var start = Date.now();

outputTemp("Reading dependencies...");

var json = npmList();

var packages = getPackagesList(json, packageName);

output("Dependencies of '" + (packageName || json.name) + "' released within last " + days + " days:");

outputPackages(packages, fromDate);

output("Time elapsed: " + timeDiff(start, Date.now()));



// -----------------------------


function generatePackagesList(packages, name, packageObj, excludeParent) {
    if(!excludeParent && (packageObj.version !== "0.0.0") && (packageObj.version !== undefined)) {
        packages.push(name + '@' + packageObj.version);
    }
    if(packageObj.dependencies) {
        Object.keys(packageObj.dependencies).forEach(function (packageName) {
            generatePackagesList(packages, packageName, packageObj.dependencies[packageName]);
        });
    }
}



function npmList() {
    var json;
    try {
        execSync('npm ls --json >latest.log 2>/dev/null');
    } catch(e) {
    }

    json = JSON.parse(fs.readFileSync('latest.log').toString());
    fs.unlink('latest.log');
    return json;
}



function getPackagesList(json, packageName) {
    var packages = [];
    if(packageName) {
        generatePackagesList(packages, packageName, json.dependencies[packageName]);
    } else {
        packageName = json.name;
        generatePackagesList(packages, packageName, json, true);
    }
    return packages;
}



function outputPackages(packages, startDate) {
    packages.forEach(function (packageName, i) {
        var modifiedDate = (execSync('npm view '+packageName+' time.modified') + "");
        modifiedDate = modifiedDate.substr(0,10) + " " + modifiedDate.substr(11,5);

        if(modifiedDate >= startDate) {
            output(packageName + "\t\t\t" + modifiedDate);
        } else {
            outputTemp(i + "/" + packages.length);
        }
    });

    output("       ");
}


function pad(num, size) {
    return ('000000000' + num).substr(-size);
} 


function timeDiff(timestamp1, timestamp2) {
    var elapsed = new Date(timestamp2 - timestamp1);
    return pad(elapsed.getUTCHours(),2) + ":" + pad(elapsed.getUTCMinutes(),2) + ":" + pad(elapsed.getUTCSeconds(),2);
}


function outputTemp(txt) {
    process.stdout.write("\r" + txt);
}


function output(txt) {
    process.stdout.write("\r" + txt + "\n");
}


