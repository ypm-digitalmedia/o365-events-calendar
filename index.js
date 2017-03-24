// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
var server = require('./server');
var router = require('./router');
var authHelper = require('./authHelper');
var outlook = require('node-outlook');
var fs = require("fs");

var targetSharedEmail = "peabody.events@yale.edu";

var handle = {};
handle['/'] = home;
handle['/authorize'] = authorize;
handle['/mail'] = mail;
handle['/calendar'] = calendar;
handle['/contacts'] = contacts;
handle['/data'] = viewdata;

server.start(router.route, handle);

function home(response, request) {
    console.log('Request handler \'home\' was called.');
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write('<!DOCTYPE html>');
    response.write('<html>');
    response.write('<head>');
    response.write('<title>Log in</title>');
    response.write('</head>');
    response.write('<body>');
    response.write('<p>Please <strong><a href="' + authHelper.getAuthUrl() + '">sign in</a></strong> with your Office 365 or Outlook.com account.</p>');
    response.write('</body>');
    response.write('</html>');
    response.end();
}

var url = require('url');

function authorize(response, request) {
    console.log('Request handler \'authorize\' was called.');

    // The authorization code is passed as a query parameter
    var url_parts = url.parse(request.url, true);
    var code = url_parts.query.code;
    console.log('Code: ' + code);
    authHelper.getTokenFromCode(code, tokenReceived, response);
}

function tokenReceived(response, error, token) {
    if (error) {
        console.log('Access token error: ', error.message);
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write('<p>ERROR: ' + error + '</p>');
        response.end();
    } else {
        getUserEmail(token.token.access_token, function(error, email) {
            if (error) {
                console.log('getUserEmail returned an error: ' + error);
                response.write('<p>ERROR: ' + error + '</p>');
                response.end();
            } else if (email) {
                var cookies = ['node-tutorial-token=' + token.token.access_token + ';Max-Age=4000',
                    'node-tutorial-refresh-token=' + token.token.refresh_token + ';Max-Age=4000',
                    'node-tutorial-token-expires=' + token.token.expires_at.getTime() + ';Max-Age=4000',
                    'node-tutorial-email=' + email + ';Max-Age=4000'
                ];
                response.setHeader('Set-Cookie', cookies);
                response.writeHead(302, { 'Location': 'http://localhost:8000/calendar' });
                response.end();
            }
        });
    }
}


function getUserCalendar(token, callback) {
    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');


}

function getUserEmail(token, callback) {
    // Set the API endpoint to use the v2.0 endpoint
    outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');

    // Set up oData parameters
    var queryParams = {
        '$select': 'DisplayName, EmailAddress',
    };

    outlook.base.getUser({ token: token, odataParams: queryParams }, function(error, user) {
        if (error) {
            callback(error, null);
        } else {
            callback(null, user.EmailAddress);
        }
    });
}

function getValueFromCookie(valueName, cookie) {
    if (cookie.indexOf(valueName) !== -1) {
        var start = cookie.indexOf(valueName) + valueName.length + 1;
        var end = cookie.indexOf(';', start);
        end = end === -1 ? cookie.length : end;
        return cookie.substring(start, end);
    }
}

function getAccessToken(request, response, callback) {
    var expiration = new Date(parseFloat(getValueFromCookie('node-tutorial-token-expires', request.headers.cookie)));

    if (expiration <= new Date()) {
        // refresh token
        console.log('TOKEN EXPIRED, REFRESHING');
        var refresh_token = getValueFromCookie('node-tutorial-refresh-token', request.headers.cookie);
        authHelper.refreshAccessToken(refresh_token, function(error, newToken) {
            if (error) {
                callback(error, null);
            } else if (newToken) {
                var cookies = ['node-tutorial-token=' + newToken.token.access_token + ';Max-Age=4000',
                    'node-tutorial-refresh-token=' + newToken.token.refresh_token + ';Max-Age=4000',
                    'node-tutorial-token-expires=' + newToken.token.expires_at.getTime() + ';Max-Age=4000'
                ];
                response.setHeader('Set-Cookie', cookies);
                callback(null, newToken.token.access_token);
            }
        });
    } else {
        // Return cached token
        var access_token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
        callback(null, access_token);
    }
}

function mail(response, request) {
    getAccessToken(request, response, function(error, token) {
        console.log('Token found in cookie: ', token);
        var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
        console.log('Email found in cookie: ', email);
        if (token) {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write('<div><h1>Your inbox</h1></div>');

            var queryParams = {
                '$select': 'Subject,ReceivedDateTime,From,IsRead',
                '$orderby': 'ReceivedDateTime desc',
                '$top': 10
            };

            // Set the API endpoint to use the v2.0 endpoint
            outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
            // Set the anchor mailbox to the user's SMTP address
            outlook.base.setAnchorMailbox(email);

            outlook.mail.getMessages({ token: token, folderId: 'inbox', odataParams: queryParams },
                function(error, result) {
                    if (error) {
                        console.log('getMessages returned an error: ' + error);
                        response.write('<p>ERROR: ' + error + '</p>');
                        response.end();
                    } else if (result) {
                        console.log('getMessages returned ' + result.value.length + ' messages.');
                        response.write('<table><tr><th>From</th><th>Subject</th><th>Received</th></tr>');
                        result.value.forEach(function(message) {
                            console.log('  Subject: ' + message.Subject);
                            var from = message.From ? message.From.EmailAddress.Name : 'NONE';
                            response.write('<tr><td>' + from +
                                '</td><td>' + (message.IsRead ? '' : '<b>') + message.Subject + (message.IsRead ? '' : '</b>') +
                                '</td><td>' + message.ReceivedDateTime.toString() + '</td></tr>');
                        });

                        response.write('</table>');
                        response.end();
                    }
                });
        } else {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write('<p> No token found in cookie!</p>');
            response.end();
        }
    });
}

function buildAttendeeString(attendees) {

    var attendeeString = 'wut';
    if (attendees) {
        attendeeString = '';

        attendees.forEach(function(attendee) {
            attendeeString += '<p>Name:' + attendee.EmailAddress.Name + '</p>';
            attendeeString += '<p>Email:' + attendee.EmailAddress.Address + '</p>';
            attendeeString += '<p>Type:' + attendee.Type + '</p>';
            attendeeString += '<p>Response:' + attendee.Status.Response + '</p>';
            attendeeString += '<p>Respond time:' + attendee.Status.Time + '</p>';
        });
    }

    return attendeeString;
}

function buildOrganizerString(organizer) {

    var organizerString = '';
    if (organizer) {

        if (organizer.hasOwnProperty("EmailAddress")) {
            var personEmail = organizer.EmailAddress;
            if (personEmail.hasOwnProperty("Name")) {
                organizerString = personEmail.Name;
            }
        }

    }

    return organizerString;
}

function buildBodyString(body) {

    var bodyString = 'text';
    if (body) {

        if (body.hasOwnProperty("Content")) {

            bodyString = body.Content;
        }

    }

    return bodyString;
}

function buildLocationString(location) {

    var locationString = '';
    if (location) {

        if (location.hasOwnProperty("DisplayName")) {
            locationString = location.DisplayName;
        }

    }

    return locationString;
}


function buildRecurrenceString(r) {
    var recurrenceHTML = "<strong>" + r.Pattern.Type + "</strong><br />";
    recurrenceHTML += "Interval: " + r.Pattern.Interval + "<br />";
    recurrenceHTML += "Month: " + r.Pattern.Month + "<br />";
    recurrenceHTML += "DayOfMonth: " + r.Pattern.DayOfMonth + "<br />";
    recurrenceHTML += "DaysOfWeek: " + r.Pattern.DaysOfWeek + "<br />";
    recurrenceHTML += "Index: " + r.Pattern.Index + "<br />";
    recurrenceHTML += "<strong>" + r.Range.Type + "</strong> (n=" + r.Range.NumberOfOccurrences + ")<br />";
    recurrenceHTML += r.Range.StartDate + " - " + r.Range.EndDate;

    return recurrenceHTML;
}




function todaysDate(filter) {
    var d = new Date();

    var year = d.getFullYear();
    var month = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);

    var today = year + "-" + month + "-" + day;
    // var filtertoday = "Start/DateTime ge '" + today + "T00:00:00'";
    var filtertoday = "End/DateTime ge '" + today + "T00:00:00' and Start/DateTime le '2022-01-01T00:00:00'";
    var filterall = "End/DateTime ge '2017-01-01T00:00:00' and Start/DateTime le '2022-01-01T00:00:00'";

    if (filter && typeof(filter) != "undefined") {

        if (filter == 'range') {
            return filtertoday;
        } else if (filter == 'beginning') {
            return filterall;
        } else {
            return filtertoday;
        }
    } else {
        return today;
    }
}


function getEventNum(iter) {
    iter += 1;
    return iter;
}

function makeTruncatedId(theId) {
    return "<span title='" + theId + "'>" + " ... " + theId.slice(-10) + "</span>";
}

function calendar(response, request) {
    var token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
    console.log('Token found in cookie: ', token);
    var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
    console.log('Email found in cookie: ', email);
    if (token) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write('<!DOCTYPE html>');
        response.write('<html>');
        response.write('<head>');
        response.write('<title>Calendar Feed</title>');
        response.write('<style>td, th { border-right: 1px #555 solid; border-bottom: 1px #555 solid; padding: 10px;} th { border-width: 3px; font-weight: bold; background-color: #ccc; }</style>');
        response.write('</head>');
        response.write('<body>');
        response.write('<div><h2>Logged in as: ' + email + '</h2><h2>Viewing events for: ' + targetSharedEmail + '</h2></div>');

        var queryParamsSingle = {
            '$select': 'Subject,Start,End,Categories,Organizer,Body,Location,Type',
            '$orderby': 'Start/DateTime asc',
            '$top': 50,
            '$filter': todaysDate('range') + " and Type ne 'SeriesMaster'"
        };

        var queryParamsRecurring = {
            '$select': 'Subject,Start,End,Categories,Organizer,Body,Location,Type,Recurrence',
            '$orderby': 'Start/DateTime asc',
            '$top': 100,
            '$filter': todaysDate('beginning') + " and Type eq 'SeriesMaster'"
        }

        // Set the API endpoint to use the v2.0 endpoint
        outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
        // outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0/me/calendarview');
        // Set the anchor mailbox to the user's SMTP address
        outlook.base.setAnchorMailbox(email);
        // Set the preferred time zone.
        // The API will return event date/times in this time zone.
        outlook.base.setPreferredTimeZone('Eastern Standard Time');

        // Pass the user's email address
        var userInfo = {
            email: targetSharedEmail
        };

        var cal = { "single": [], "recurring": [], "instances": [], "combined": [] };

        // ======================================================================================================
        // PROCESS:
        // 1. Query single events, write cal.single
        // 2. Query recurring events, write cal.recurring
        // 3. Iterate through cal.recurring, generate singleInstance clones and push to cal.instances 
        // 4. Process and push cal.single and cal.instances to cal.combined
        // 5. Sort cal.combined
        // 6. Write data table using cal.combined
        // 7. Write JSON file and log using cal.combined
        // ======================================================================================================



        // ============================== 1. Query single events, write cal.single ==============================
        outlook.calendar.getEvents({ token: token, folderId: 'Inbox', odataParams: queryParamsSingle, user: userInfo }, function(error, result) {
            if (error) {
                console.log('getEvents returned an error: ' + error);
                response.write('<p><strong>ERROR: </strong>' + error + '</p>');
                response.write('</body>');
                response.write('</html>');
                response.end();
            } else if (result) {
                console.log('getEvents returned ' + result.value.length + ' singleInstance event(s).');

                cal.single = result.value;

                console.log("\n\n\n\nDUMP:\n\n\n");
                console.log(cal.single);



                // ============================== 2. Query recurring events, write cal.recurring ==============================
                outlook.calendar.getEvents({ token: token, folderId: 'Inbox', odataParams: queryParamsRecurring, user: userInfo }, function(error, result2) {
                    if (error) {
                        console.log('getEvents returned an error: ' + error);
                        response.write('<p><strong>ERROR: </strong>' + error + '</p>');
                        response.write('</body>');
                        response.write('</html>');
                        response.end();
                    } else if (result2) {
                        console.log('getEvents returned ' + result2.value.length + ' seriesMaster event(s) started since 01-01-2017.');

                        cal.recurring = result2.value;

                        console.log("\n\n\n\nDUMP:\n\n\n");
                        console.log(cal.recurring);


                        // ============================== 3. Iterate through cal.recurring, generate singleInstance clones and push to cal.instances  ==============================

                        cal.recurring.forEach(function(event) {
                            var tmpEvents = [];
                            var tmpEvent = event;
                            tmpEvent.Type = "Instance";

                        });

                        // ============================== 4. Process and push cal.single and cal.instances to cal.combined ==============================

                        cal.single.forEach(function(item, iter) {
                            var newItem = item;
                            newItem.Status = "active";
                            newItem.LastEditedBy = "";
                            cal.combined.push(newItem);
                            console.log('"' + newItem.Subject + '" pushed to COMBINED array.\n');
                        });

                        // PUSH INSTANCES TO COMBINED HERE

                        console.log("\n\n\nCOMBINED:\n\n\n");
                        console.log(cal.combined);

                        // ============================== 5. Sort cal.combined ==============================



                        // ============================== 6. Write data table using cal.combined ==============================


                        response.write('<h4>Single Instance Events</h4>');
                        response.write('<table class="calendardump"><tr><th>#</th><th>ID</th><th>Subject</th><th>Start</th><th>End</th><th>Categories</th><th>Organizer</th><th>Body</th><th>Location</th><th>Type</th></tr>');

                        // ======================= SINGLE INSTANCES
                        cal.single.forEach(function(event, iter) {
                            // console.log('  Subject: ' + event.Subject);
                            // console.log('  Event dump: ' + JSON.stringify(event));
                            response.write('<tr>' +
                                '<td>' + getEventNum(iter) +
                                '</td><td>' + makeTruncatedId(event.Id) +
                                '</td><td>' + event.Subject +
                                '</td><td>' + event.Start.DateTime.toString() +
                                '</td><td>' + event.End.DateTime.toString() +
                                '</td><td>' + event.Categories.toString() +
                                '</td><td>' + buildOrganizerString(event.Organizer) +
                                '</td><td>' + buildBodyString(event.Body) +
                                '</td><td>' + buildLocationString(event.Location) +
                                '</td><td>' + event.Type +
                                '</td></tr>');
                        });
                        response.write('</table>');

                        // ======================= EXTRACTED INSTANCES
                        response.write('<h4>Extracted Single Events from Series</h4>');
                        response.write('<table class="calendardump"><tr><th>#</th><th>ID</th><th>Subject</th><th>Start</th><th>End</th><th>Categories</th><th>Organizer</th><th>Body</th><th>Location</th><th>Type</th></tr>');
                        cal.instances.forEach(function(event, iter) {
                            // console.log('  Subject: ' + event.Subject);
                            // console.log('  Event dump: ' + JSON.stringify(event));
                            response.write('<tr>' +
                                '<td>' + getEventNum(iter) +
                                '</td><td>' + makeTruncatedId(event.Id) +
                                '</td><td>' + event.Subject +
                                '</td><td>' + event.Start.DateTime.toString() +
                                '</td><td>' + event.End.DateTime.toString() +
                                '</td><td>' + event.Categories.toString() +
                                '</td><td>' + buildOrganizerString(event.Organizer) +
                                '</td><td>' + buildBodyString(event.Body) +
                                '</td><td>' + buildLocationString(event.Location) +
                                '</td><td>' + event.Type +
                                '</td></tr>');
                        });
                        response.write('</table>');

                        // ======================= SERIES
                        response.write('<h4>SeriesMaster Events</h4>');
                        response.write('<table class="calendardump"><tr><th>#</th><th>ID</th><th>Subject</th><th>Start</th><th>End</th><th>Categories</th><th>Organizer</th><th>Body</th><th>Location</th><th>Type</th><th>Recurrence</th></tr>');
                        cal.recurring.forEach(function(event, iter) {
                            // console.log('  Subject: ' + event.Subject);
                            // console.log('  Event dump: ' + JSON.stringify(event));
                            response.write('<tr>' +
                                '<td>' + getEventNum(iter) +
                                '</td><td>' + makeTruncatedId(event.Id) +
                                '</td><td>' + event.Subject +
                                '</td><td>' + event.Start.DateTime.toString() +
                                '</td><td>' + event.End.DateTime.toString() +
                                '</td><td>' + event.Categories.toString() +
                                '</td><td>' + buildOrganizerString(event.Organizer) +
                                '</td><td>' + buildBodyString(event.Body) +
                                '</td><td>' + buildLocationString(event.Location) +
                                '</td><td>' + event.Type +
                                '</td><td>' + buildRecurrenceString(event.Recurrence) +
                                '</td></tr>');
                        });
                        response.write('</table>');



                        // DO THE SAME FOR COMBINED






                        response.write('</body></html>');
                        response.end();

                        // ============================== 7. Write JSON file and log using cal.combined ==============================

                        // CHANGE cal.single TO cal.combined

                        fs.writeFile('data/caldata_' + todaysDate() + '.json', JSON.stringify(cal.single, null, "\t"), 'utf8', function readFileCallback(err, data) {
                            if (err) {
                                console.log(err);
                            } else {

                                var now = new Date();
                                fs.readFile('data/datafiles.log', 'utf8', function readFileCallback2(err2, data2) {
                                    if (err2) {
                                        console.log(err2);
                                        logTxt = data2; //now it an object
                                        logTxt += now + '\tcaldata_' + todaysDate() + '.json\t' + email + '\tERROR: ' + err2 + '\n';
                                        fs.writeFile('data/datafiles.log', logTxt, 'utf8', function logCallback(err, data3) {
                                            console.log("\n\nlog file updated WITH ERRORS.");
                                        }); // write it back
                                    } else {
                                        logTxt = data2; //now it an object
                                        logTxt += now + '\tcaldata_' + todaysDate() + '.json\t' + email + '\tOK\n';
                                        fs.writeFile('data/datafiles.log', logTxt, 'utf8', function logCallback(err, data3) {
                                            console.log("\n\nlog file updated SUCCESSFULLY.  Single instances only.");
                                        }); // write it back
                                    }



                                });

                                console.log('\n\ndata/data_' + todaysDate() + '.json written to disk.  Single instances only.\n');
                            }
                        });











                    }
                });
            }
        });


    } else { // BAD AUTH
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write('<p> No token found in cookie!</p>');
        response.end();
    }
}





















function contacts(response, request) {
    var token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
    console.log('Token found in cookie: ', token);
    var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
    console.log('Email found in cookie: ', email);
    if (token) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write('<div><h1>Your contacts</h1></div>');

        var queryParams = {
            '$select': 'GivenName,Surname,EmailAddresses',
            '$orderby': 'GivenName asc',
            '$top': 10
        };

        // Set the API endpoint to use the v2.0 endpoint
        outlook.base.setApiEndpoint('https://outlook.office.com/api/v2.0');
        // Set the anchor mailbox to the user's SMTP address
        outlook.base.setAnchorMailbox(email);

        outlook.contacts.getContacts({ token: token, odataParams: queryParams },
            function(error, result) {
                if (error) {
                    console.log('getContacts returned an error: ' + error);
                    response.write('<p>ERROR: ' + error + '</p>');
                    response.end();
                } else if (result) {
                    console.log('getContacts returned ' + result.value.length + ' contacts.');
                    response.write('<table><tr><th>First name</th><th>Last name</th><th>Email</th></tr>');
                    result.value.forEach(function(contact) {
                        var email = contact.EmailAddresses[0] ? contact.EmailAddresses[0].Address : 'NONE';
                        response.write('<tr><td>' + contact.GivenName +
                            '</td><td>' + contact.Surname +
                            '</td><td>' + email + '</td></tr>');
                    });

                    response.write('</table>');
                    response.end();
                }
            });
    } else {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.write('<p> No token found in cookie!</p>');
        response.end();
    }
}

function viewdata(response, request) {
    console.log("\nview data folder\n")
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write('<div><h1>Calendar Data</h1></div>')

    fs.realpath("data", function(err, path) {
        if (err) {
            console.log(err);
            response.write("<p>" + err + "</p>");
            return;
        }
        console.log('Path is: ' + path);
        response.write("<p>Path is: " + path + "</p>");

    });
    fs.readdir("data", function(err, files) {
        if (err) return;
        files.forEach(function(f) {
            console.log('Files: ' + f);
            response.write("<p>Files: " + f + "</p>");
        });
    });


    var logcontent = fs.readFileSync("data/datafiles.log");
    console.log("Output Content: \n" + logcontent);
    console.log("\n *EXIT* \n");

    response.write("<p><strong>Log files:</strong><br />" + logcontent + "</p>");
    response.end();
}

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