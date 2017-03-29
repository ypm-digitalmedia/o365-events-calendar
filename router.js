// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
var fs = require("fs");

var whitelist = ["viewer", "media", "templates"];

function route(handle, pathname, response, request) {
    console.log('About to route a request for ' + pathname);

    var pathnameClean = pathname.split("/").join("");

    if (whitelist.indexOf(pathnameClean) > -1) {
        console.log("Handling request for plain directory " + pathname);
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write('<!DOCTYPE html>');
        response.write('<html>');
        response.write('<head>');
        // response.write('<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous" />');
        response.write('<link href="node_modules/bootstrap/dist/css/bootstrap.min.css" type="text/css" rel="stylesheet" />');
        response.write('<link href="main.css" type="text/css" rel="stylesheet" />');
        response.write('<link rel="icon" href="media/Favicon/ypm-favicon1_32.png" sizes="32x32">');
        response.write('<title>' + pathnameClean + '</title>');
        response.write('</head>');
        response.write('<body>');
        response.write('<p>This is a custom page for <strong>' + pathname + '</strong></p>');
        response.write('</body>');
        response.write('</html>');
        response.end();
    } else if (pathnameClean.indexOf(".css") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing contents of CSS file " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".js") > -1) {

        var jstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing contents of JS file " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'text/javascript' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".jpg") > -1 || pathnameClean.indexOf(".jpeg") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing JPEG image " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'image/jpeg' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".gif") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing GIF image " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'image/gif' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".png") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing PNG image " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'image/png' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".otf") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing OpenType font " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'font/opentype' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".ttf") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing TrueType font " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'font/truetype' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".json") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing JSON file " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'application/javascript' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".log") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing log file " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'text/plain' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".m4v") > -1 || pathnameClean.indexOf(".mp4") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing MPEG video " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'video/mpeg' });
                response.write(data);
                response.end();
            }
        });

    } else if (pathnameClean.indexOf(".mov") > -1) {

        var csstext = fs.readFile(__dirname + pathname, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log("writing QuickTime video " + __dirname + pathname);
                response.writeHead(200, { 'Content-Type': 'video/quicktime' });
                response.write(data);
                response.end();
            }
        });

    } else if (typeof handle[pathname] === 'function') {
        return handle[pathname](response, request);
    } else {
        console.log('No request handler found for ' + pathname);
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.write('404 Not Found');
        response.end();
    }
}

exports.route = route;

/*
  MIT License: 

  Permission is hereby granted, free of charge, to any person obtaining 
  a copy of this software and associated documentation files (the 
  ""Software""), to deal in the Software without restriction, including 
  without limitation the rights to use, copy, modify, merge, publish, 
  distribute, sublicense, and/or sell copies of the Software, and to 
  permit persons to whom the Software is furnished to do so, subject to 
  the following conditions: 

  The above copyright notice and this permission notice shall be 
  included in all copies or substantial portions of the Software. 

  THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND, 
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/