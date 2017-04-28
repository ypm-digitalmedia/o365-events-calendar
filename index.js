// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See full license at the bottom of this file.
var server = require('./server');
var router = require('./router');
var authHelper = require('./authHelper');
var outlook = require('node-outlook');
var fs = require("fs");
var moment = require("moment");
var handlebars = require("handlebars");
var _ = require('lodash');
var qs = require('querystring');

var data_modified = false;
var current_data_exists = false;

var targetSharedEmail = "peabody.events@yale.edu";

var handle = {};
handle['/'] = home;
handle['/authorize'] = authorize;
handle['/calendar'] = calendar;
handle['/updateCalendar'] = updateCalendar;

server.start(router.route, handle);

function home(response, request) {
    console.log('Request handler \'home\' was called.');
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.write('<!DOCTYPE html>');
    response.write('<html>');
    response.write('<head>');
    response.write('<meta charset="UTF-8">');
    // response.write('<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous" />');
    response.write('<link href="node_modules/bootstrap/dist/css/bootstrap.min.css" type="text/css" rel="stylesheet" />');
    response.write('<link href="node_modules/font-awesome/css/font-awesome.min.css" type="text/css" rel="stylesheet" />');
    response.write('<link href="main.css" type="text/css" rel="stylesheet" />');
    response.write('<title>Peabody Events Calendar | Sign in with Outlook 365</title>');
    response.write('<link rel="icon" href="media/Favicon/ypm-favicon1_32.png" sizes="32x32">');
    response.write('</head>');
    response.write('<body>');
    response.write('<div class="logo"><img src="media/peabody-text-logo-2160.png" /><h4>Digital Media</h4></div>');
    response.write('<div class="Aligner">');
    response.write('<div class="dialog">');
    response.write('<div class="dialog-header"><h2>Events Calendar</h2></div>');
    response.write('<img src="media/microsoft-office-365-logo.png" class="office-logo" />')
        // response.write('<h3>Sign in</h3>');
    response.write('<p>Please sign in with your Office 365 or Outlook.com account.</p><br /><br />');
    response.write('<p align="center"><a href="' + authHelper.getAuthUrl() + '"><button class="btn btn-primary btn-lg">Continue <i class="fa fa-caret-right" aria-hidden="true"></i></button></a></p>');
    response.write('</div>');
    response.write('</div>');
    response.write('</body>');
    response.write('</html>');
    response.end();


}

var eventCategories = [
    { name: "Special Openings", value: "special_openings" },
    { name: "Gallery Talks", value: "gallery_talks" },
    { name: "Summer Camps", value: "summer_camps" },
    { name: "School Programs", value: "school_programs" },
    { name: "Family Events", value: "family_events" },
    { name: "Talks", value: "talks" },
    { name: "Workshops", value: "workshops" },
    { name: "Movies", value: "movies" },
    { name: "Announcements", value: "announcements" },
    { name: "Daily Special Events", value: "daily_special_events" },
    { name: "Programs for Adults", value: "programs_for_adults" },
    { name: "Illustration Classes", value: "illustration_classes" },
    { name: "Facilities, Maintenance & Closures", value: "facilities_maintenance_closures" },
    { name: "Tours", value: "tours" },
    { name: "General", value: "general" }
];

var url = require('url');

(function() {
    if (typeof Object.defineProperty === 'function') {
        try { Object.defineProperty(Array.prototype, 'sortBy', { value: sb }); } catch (e) {}
    }
    if (!Array.prototype.sortBy) Array.prototype.sortBy = sb;

    function sb(f) {
        for (var i = this.length; i;) {
            var o = this[--i];
            this[i] = [].concat(f.call(o, o, i), o);
        }
        this.sort(function(a, b) {
            for (var i = 0, len = a.length; i < len; ++i) {
                if (a[i] != b[i]) return a[i] < b[i] ? -1 : 1;
            }
            return 0;
        });
        for (var i = this.length; i;) {
            this[--i] = this[i][this[i].length - 1];
        }
        return this;
    }
})();


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



function buildCategoriesSelect(item) {
    var selectHTML = "<select title='select" + item + "' onchange='changeCategory(" + item + ",this.options[this.selectedIndex].value)'>";
    selectHTML += "<option value='' selected>select a category</option>";

    eventCategories.forEach(function(category) {
        selectHTML += "<option value='" + category.name + "'>" + category.name + "</option>";
    });

    selectHTML += "</select>";

    return selectHTML;
}

function buildBodyString(body) {

    var bodyStringHTML = 'html';
    var bodyStringText = 'text';
    if (body) {

        if (body.hasOwnProperty("Content")) {
            bodyStringHTML = body.Content.toString();
            // extract only the inner HTML from the <body> tag of the message content
            bodyStringText = bodyStringHTML.match(/<body[^>]*>[\s\S]*<\/body>/gi);
        }

    }
    // console.log(bodyStringText);
    return bodyStringText;
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

function lastToFirst(this_array) {
    //this_array.splice(0,0,this_array[this_array.length-1]);
    //this_array.pop();
    var new_array = new Array();
    new_array[0] = this_array[this_array.length - 1]; //first element is last element    
    for (i = 1; i < this_array.length; i++) { //subsequent elements start at 1
        new_array[i] = this_array[i - 1];
    }
    return new_array;
}

function buildDaysOfWeekInterval(arr, firstDay) {
    // console.log("Raw array: " + arr);
    if (!firstDay) { var firstDay = "Sunday"; }

    if (arr[arr.length - 1] == firstDay) { arr = lastToFirst(arr); }


    var startDay = arr[0];
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var dowArr = [0];
    var startIndex = days.indexOf(startDay);

    for (var i = 1; i < arr.length; i++) {
        dowArr.push(days.indexOf(arr[i]) - days.indexOf(arr[0]));
    }
    // console.log("\n\n\nDAYS: " + arr + " | PATTERN: " + dowArr);
    return dowArr;
}

function getMostRecentFileName(dir, ext) {
    var files = fs.readdirSync(dir);
    // WITHOUT EXTENSION PARAMETER, FUNCTION CAN RETURN THUMBS_DB AND LOG FILE, OR MOST RECENT FILE (USUALLY LOG FILE)
    // WITH EXTENSION PARAMETER, FUNCTION CAN RETURN 'NULL' (IF LENGTH 0) OR MOST RECENT FILE
    if (ext) {
        files = _.reject(files, function(f) { return f.toString().indexOf("." + ext) == -1; });
        if (files.length == 0) {
            return null;
        } else {
            // REMOVE newest.json FROM LIST OF ACCEPTABLE FILES
            files = _.reject(files, function(f) { return f == "newest.json" });
            // console.log("\n\nORIGINAL FILES ARRAY:\n" + files + "\n\n\n");

            return _.max(files, function(f) {
                var fullpath = path.join(dir, f);
                var latest = fs.statSync(fullpath).ctime;
                return latest;
            });
        }
    } else {
        // console.log(files);
        return _.max(files, function(f) {
            var fullpath = path.join(dir, f);
            var latest = fs.statSync(fullpath).ctime;
            return latest;
        });
    }


}

function randomId(len) {
    if (!len || isNaN(len)) { len = 8; }
    len = Math.round(len);
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
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



function updateCalendar(response, request) {

    console.log(request.method + " REQUEST RECEIVED");

    if (request.method === 'POST') {
        // the body of the POST is JSON payload.
        var data = '';
        request.addListener('data', function(chunk) { data += chunk; });
        request.addListener('end', function() {
            try {
                events = JSON.parse(data);
                response.writeHead(200, { 'content-type': 'text/plain' });
                response.write(events);
                response.end('\n');
            } catch (e) {
                response.writeHead(500, { 'content-type': 'text/plain' });
                response.write('ERROR:' + e);
                response.end('\n');
            }
        });
    }




    // response.writeHead(200, {
    //     'Content-Type': 'text/plain',
    //     'Access-Control-Allow-Origin': '*',
    //     'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    //     'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    //     'Access-Control-Allow-Credentials': 'true'
    // });
    // response.end('Hello World\n');
}


function calendar(response, request) {
    var token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
    console.log('Token found in cookie: ', token);
    var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
    console.log('Email found in cookie: ', email);
    if (token) {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        // response.writeHead(200, {
        //     'Content-Type': 'text/html',
        //     'Access-Control-Allow-Origin': '*',
        //     'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
        //     'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        //     'Access-Control-Allow-Credentials': 'true'
        // });
        response.write('<!DOCTYPE html>');
        response.write('<html>');
        response.write('<head>');
        response.write('<meta charset="UTF-8">');
        response.write('<link href="node_modules/bootstrap/dist/css/bootstrap.min.css" type="text/css" rel="stylesheet" />');
        response.write('<link href="node_modules/bootstrap-toggle/css/bootstrap-toggle.css" type="text/css" rel="stylesheet" />');
        response.write('<link href="node_modules/font-awesome/css/font-awesome.min.css" type="text/css" rel="stylesheet" />');
        response.write('<link href="main.css" type="text/css" rel="stylesheet" />');
        response.write('<title>Peabody Events Calendar</title>');
        response.write('<link rel="icon" href="media/Favicon/ypm-favicon1_32.png" sizes="32x32">');
        response.write('</head>');
        response.write('<body>');


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
        // 1. Check if data file (JSON) already exists
        // 2. Query single events, write cal.single
        // 3. Query recurring events, write cal.recurring
        // 4. Iterate through cal.recurring, generate singleInstance clones and push to cal.instances 
        // 5. Process and push cal.single and cal.instances to cal.combined
        // 6. Sort cal.combined
        // 7. Write JSON file and log using cal.combined
        // 8. Write data table using cal.combined

        // ======================================================================================================

        // console.log("\n\n\n\nMOST RECENT FILE: \n");
        // console.log(getMostRecentFileName(__dirname + "/data", "json"));
        // console.log("\n\n\n\n\n");

        // ============================== 1. Check if today's data file (JSON) exists

        var now = new Date();
        fs.readFile('data/caldata_' + todaysDate() + '.json', 'utf8', function(err, data) {

            if (err) {
                // today's file doesn't exist... write it!
                // response.write('<h1>TIME TO MAKE A NEW FILE!</h1>');
                current_data_exists = false;
            } else {
                // today's file already exists... load it!
                // response.write('<h1>TODAY&apos;S FILE EXISTS!</h1>');
                current_data_exists = true;
            }

        });


        // ============================== 2. Query single events, write cal.single ==============================
        outlook.calendar.getEvents({ token: token, folderId: 'Inbox', odataParams: queryParamsSingle, user: userInfo }, function(error, result) {
            if (error) {
                console.log('\ngetEvents returned an error: ' + error);
                response.write('<p><strong>ERROR: </strong>' + error + '</p>');
                response.write('</body>');
                response.write('</html>');
                response.end();
            } else if (result) {
                console.log('\ngetEvents returned ' + result.value.length + ' singleInstance event(s).\n');

                cal.single = clone(result.value);

                // console.log("\n\n\n\nDUMP:\n\n\n");
                // console.log(cal.single);



                // ============================== 3. Query recurring events, write cal.recurring ==============================
                outlook.calendar.getEvents({ token: token, folderId: 'Inbox', odataParams: queryParamsRecurring, user: userInfo }, function(error, result2) {
                    if (error) {
                        console.log('\ngetEvents returned an error: ' + error);
                        response.write('<p><strong>ERROR: </strong>' + error + '</p>');
                        response.write('</body>');
                        response.write('</html>');
                        response.end();
                    } else if (result2) {
                        console.log('\ngetEvents returned ' + result2.value.length + ' seriesMaster event(s) started since 01-01-2017.\n');

                        cal.recurring = clone(result2.value);

                        // console.log("\n\n\n\nDUMP:\n\n\n");
                        // console.log(cal.recurring);


                        // ============================== 4. Iterate through cal.recurring, generate singleInstance clones and push to cal.instances  ==============================

                        cal.recurring.forEach(function(series) {
                            var n = 0;
                            var freq = series.Recurrence.Pattern.Type;
                            var firstDayOfWeek = series.Recurrence.Pattern.FirstDayOfWeek;

                            var start = series.Start.DateTime;
                            var end = series.End.DateTime;
                            var today = moment().startOf('day').format();

                            if (freq == "Daily") {
                                var max = 30;
                                var increment = 1;
                                var incType = "day";
                                var offsetPattern = [0];

                            } else if (freq == "Weekly") {
                                var max = 4;
                                var increment = series.Recurrence.Pattern.Interval;
                                var incType = "week";

                                var dow = series.Recurrence.Pattern.DaysOfWeek;
                                if (dow.length > 1) {
                                    var offsetPattern = buildDaysOfWeekInterval(dow, firstDayOfWeek);
                                } else {
                                    var offsetPattern = [0];
                                }
                                max *= dow.length;

                            } else if (freq == "Monthly" || freq == "AbsoluteMonthly") {
                                var max = 2;
                                var increment = series.Recurrence.Pattern.Interval;
                                var incType = "month";
                                var offsetPattern = [0];

                            } else if (freq == "Yearly" || freq == "AbsoluteYearly") {
                                var max = 1;
                                var increment = series.Recurrence.Pattern.Interval;
                                var incType = "year";
                                var offsetPattern = [0];
                            }

                            var x = n;

                            while (n < max) {
                                if (offsetPattern.length == 1) {
                                    var tS = moment(start).clone().add(x, incType);
                                    var tE = moment(end).clone().add(x, incType);

                                    var timeObj = [{ "tS": tS, "tE": tE, "diff": tS.diff(today) }];

                                } else {

                                    var timeObj = [];

                                    for (var k = 0; k < offsetPattern.length; k++) {
                                        var tS = moment(start).clone().add({ weeks: x, days: offsetPattern[k] });
                                        var tE = moment(end).clone().add({ weeks: x, days: offsetPattern[k] });
                                        var diff = tS.diff(today);
                                        timeObj.push({ "tS": tS, "tE": tE, "diff": tS.diff(today) });
                                    }

                                }

                                for (var q = 0; q < timeObj.length; q++) {
                                    // console.log("x: " + x + " | n: " + n + " | tS: " + timeObj[q].tS.format('dddd, MMMM D, YYYY h:mm a') + " | tE: " + timeObj[q].tE.format('dddd, MMMM D, YYYY h:mm a') + " | diff: " + timeObj[q].diff + "ms");

                                    // if diff is negative, the event instance occurred in the past!
                                    if (timeObj[q].diff < 0) {
                                        x += increment;
                                    } else {
                                        var tmpEvent = clone(series);

                                        var newStart = new Date(timeObj[q].tS);
                                        var newEnd = new Date(timeObj[q].tE);
                                        // console.log("newStart: " + newStart + "\n");
                                        tmpEvent.Start.DateTime = newStart;
                                        tmpEvent.End.DateTime = newEnd;

                                        x += increment;
                                        n++;

                                        tmpEvent.Type = "Instance";
                                        cal.instances.push(tmpEvent);
                                    }
                                }
                            }

                        });

                        // ============================== 5. Process and push cal.single and cal.instances to cal.combined ==============================

                        cal.single.forEach(function(item, iter) {
                            var newItem = item;
                            newItem.Status = "active";
                            newItem.Id = randomId(32);
                            newItem.LastEditedBy = "";

                            if (newItem.Categories.constructor === Array && newItem.Categories.length > 0) { newItem.Categories = newItem.Categories[0]; } else { newItem.Categories = ""; }
                            if (newItem.Subject.toLowerCase().indexOf("tour") > -1) { newItem.Categories = "Tours"; }
                            if (newItem.Subject.toLowerCase().indexOf("talk") > -1) { newItem.Categories = "Talks"; }
                            if (newItem.Subject.toLowerCase().indexOf("lecture") > -1) { newItem.Categories = "Talks"; }
                            if (newItem.Subject.toLowerCase().indexOf("gallery talk") > -1) { newItem.Categories = "Gallery Talks"; }
                            if (newItem.Subject.toLowerCase().indexOf("camp") > -1) { newItem.Categories = "Summer Camps"; }
                            if (newItem.Subject.toLowerCase().indexOf("thursday") > -1) { newItem.Categories = "Special Openings"; }

                            newItem.Start.Date = moment(item.Start.DateTime).format('dddd, MMMM D');
                            newItem.Start.FullDate = moment(item.Start.DateTime).format('dddd, MMMM D, YYYY');
                            newItem.Start.Time = moment(item.Start.DateTime).format('h:mm a');
                            newItem.Start.Day = moment(item.Start.DateTime).format('dddd');
                            newItem.Start.Hour = moment(item.Start.DateTime).format('h');
                            newItem.Start.Minute = moment(item.Start.DateTime).format('mm');
                            newItem.Start.Year = moment(item.Start.DateTime).format('YYYY');

                            newItem.End.Date = moment(item.End.DateTime).format('dddd, MMMM D');
                            newItem.End.FullDate = moment(item.End.DateTime).format('dddd, MMMM D, YYYY');
                            newItem.End.Time = moment(item.End.DateTime).format('h:mm a');
                            newItem.End.Day = moment(item.End.DateTime).format('dddd');
                            newItem.End.Hour = moment(item.End.DateTime).format('h');
                            newItem.End.Minute = moment(item.End.DateTime).format('mm');
                            newItem.End.Year = moment(item.End.DateTime).format('YYYY');

                            // reformat Start.DateTime and End.DateTime as vanilla Date() objects
                            // instances has this done already
                            newItem.Start.DateTime = new Date(newItem.Start.DateTime);
                            newItem.End.DateTime = new Date(newItem.End.DateTime);

                            cal.combined.push(newItem);
                            console.log('New singleInstance event: ' + newItem.Subject + ' - ' + newItem.Start.FullDate + " @ " + newItem.Start.Time);
                        });

                        cal.instances.forEach(function(item, iter) {
                            var newItem = item;
                            newItem.Status = "active";
                            newItem.Id = randomId(32);
                            newItem.LastEditedBy = "";

                            if (newItem.Categories.constructor === Array && newItem.Categories.length > 0) { newItem.Categories = newItem.Categories[0]; } else { newItem.Categories = ""; }
                            if (newItem.Subject.toLowerCase().indexOf("tour") > -1) { newItem.Categories = "Tours"; }
                            if (newItem.Subject.toLowerCase().indexOf("talk") > -1) { newItem.Categories = "Talks"; }
                            if (newItem.Subject.toLowerCase().indexOf("lecture") > -1) { newItem.Categories = "Talks"; }
                            if (newItem.Subject.toLowerCase().indexOf("gallery talk") > -1) { newItem.Categories = "Gallery Talks"; }
                            if (newItem.Subject.toLowerCase().indexOf("camp") > -1) { newItem.Categories = "Summer Camps"; }
                            if (newItem.Subject.toLowerCase().indexOf("first thursday") > -1) { newItem.Categories = "Special Openings"; }



                            newItem.Start.Date = moment(item.Start.DateTime).format('dddd, MMMM D');
                            newItem.Start.FullDate = moment(item.Start.DateTime).format('dddd, MMMM D, YYYY');
                            newItem.Start.Time = moment(item.Start.DateTime).format('h:mm a');
                            newItem.Start.Day = moment(item.Start.DateTime).format('dddd');
                            newItem.Start.Hour = moment(item.Start.DateTime).format('h');
                            newItem.Start.Minute = moment(item.Start.DateTime).format('mm');
                            newItem.Start.Year = moment(item.Start.DateTime).format('YYYY');

                            newItem.End.Date = moment(item.End.DateTime).format('dddd, MMMM D');
                            newItem.End.FullDate = moment(item.End.DateTime).format('dddd, MMMM D, YYYY');
                            newItem.End.Time = moment(item.End.DateTime).format('h:mm a');
                            newItem.End.Day = moment(item.End.DateTime).format('dddd');
                            newItem.End.Hour = moment(item.End.DateTime).format('h');
                            newItem.End.Minute = moment(item.End.DateTime).format('mm');
                            newItem.End.Year = moment(item.End.DateTime).format('YYYY');

                            cal.combined.push(newItem);
                            console.log('New recurring event: ' + newItem.Subject + ' - ' + newItem.Start.FullDate + " @ " + newItem.Start.Time);
                        });

                        // console.log("\n\n\nCOMBINED:\n\n\n");
                        // console.log(cal.combined);
                        console.log("\nTotal items in COMBINED array: " + cal.combined.length);

                        // ============================== 6. Sort cal ==============================

                        cal.single.sortBy(function(o) { return o.Start.DateTime });
                        cal.recurring.sortBy(function(o) { return o.Start.DateTime });
                        cal.instances.sortBy(function(o) { return o.Start.DateTime });
                        cal.combined.sortBy(function(o) { return o.Start.DateTime }); // this is the important one





                        // ============================== 7. Write JSON file and log using cal.combined ==============================

                        // CHANGE cal.single TO cal.combined

                        fs.writeFile('data/caldata_' + todaysDate() + '.json', JSON.stringify(cal.combined, null, "\t"), 'utf8', function readFileCallback(err, data) {
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
                                            console.log("\n\nlog file updated SUCCESSFULLY.");
                                        }); // write it back
                                    }



                                });

                                console.log('\n\ndata/data_' + todaysDate() + '.json written to disk.  (combined single and recuring instances)\n');

                            }
                        });


                        // ============================== 8a. Find most current JSON file =====================================
                        // ============================== 8b. Record most current JSON file to latestData.log =====================================

                        var newestFile = getMostRecentFileName(__dirname + "/data", "json");
                        if (newestFile) {
                            var fileLink = '<a href="data/' + newestFile + '" target="_blank" title="View Data"><i class="fa fa-file-code-o" aria-hidden="true"></i> ' + newestFile + '</a>';
                            var newestFileLog = 'data/newest.json'
                            var newestFileObj = { "newestFile": newestFile };
                            //fs.writeFile(newestFileLog, newestFile, 'utf8', function readFileCallback(err, data) {
                            fs.writeFile(newestFileLog, JSON.stringify(newestFileObj, null, "\t"), 'utf8', function readFileCallback(err, data) {

                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('\n\nNewest data version written to ' + newestFileLog + ' \n');
                                }
                            });
                        } else {
                            fileLink = "";
                        }


                        // ============================== 8c. Make navbar with authentication info and selection totals ===========================

                        response.write('<nav class="navbar navbar-default">');
                        response.write('<div class="container-fluid">');
                        response.write('<h3>Events calendar: ' + targetSharedEmail + '</h3>');
                        // response.write('<div class="navbar-header"><a class="navbar-brand" href="javascript:void(0)"><h5>Events calendar: ' + targetSharedEmail + '</h5></a></div>');

                        response.write('<form method="POST" action="./updateCalendar" name="update">');
                        response.write('<input id="data" type="hidden" name="data" value="" />');
                        response.write('<ul class="nav navbar-nav navbar-left">');
                        response.write('<li><a href="javascript:makeData(\'saveButton\')"><button class="btn btn-basic disabled btn-lg" id="saveButton"><i class="fa fa-save" aria-hidden="true"></i> Save</li>');
                        response.write('<li>' + fileLink + '</li>');
                        response.write('</ul>');
                        response.write('</form>');

                        response.write('<ul class="nav navbar-nav navbar-right">')
                        response.write('<li><a href="/" title="log out"><i class="fa fa-user" aria-hidden="true"></i> ' + email + '</a></li>');
                        response.write('</ul>');
                        response.write('</div>');
                        response.write('</nav>');

                        // ============================== 8d. Write data table using cal.combined ==============================

                        // response.write('<table class="calendardump calendar-combined"><tr><th>#</th><th>ID</th><th>Subject</th><th>Start</th><th>End</th><th>Categories</th><th>Organizer</th><th>Body</th><th>Location</th><th>Type</th></tr>');
                        response.write('<table class="calendar">');
                        response.write('<thead><tr><th width="50" class="checkboxcell"><input type="checkbox" class="select-all-events" id="selectAllEvents" checked data-toggle="toggle" data-onstyle="success" data-offstyle="danger" data-size="small" /></th><th class="datacell"><h4>Date</h4></th><th class="datacell"><h4>Time</h4></th><th class="datacell"><h4>Category</h4></th><th class="datacell"><h4>Location</h4></th></tr></thead>');
                        response.write('<tbody>');
                        cal.combined.forEach(function(event, iter) {
                            var i = getEventNum(iter);

                            response.write('<tr class="tablerow tablerow-start" rel="tablerow-' + i + '">' +
                                '<td rowspan="2" class="checkboxcell"><input type="checkbox" class="select-event" rel="' + event.Id + '" id="sel|' + i + '" checked data-toggle="toggle" data-onstyle="success" data-size="mini" /></td>' +
                                '<td class="datacell"><strong>' + event.Start.Date + '</strong></td>' +
                                '<td class="datacell"><strong>' + event.Start.Time + ' &ndash; ' + event.End.Time + '</strong></td>' +
                                '<td class="datacell">' + buildCategoriesSelect(i) + '</td>' +
                                '<td class="datacell">' + buildLocationString(event.Location) + '</td>' +
                                '</tr>' +
                                '<tr class="tablerow tablerow-end" rel="tablerow-' + i + '">' +
                                '<td colspan="4" class="datacell"><h4>' + event.Subject + '</h4><div class="body-text">' + buildBodyString(event.Body) + '</div></td>' +
                                '</tr>');



                        });
                        response.write('</tbody></table>');

                        response.write('<script src="node_modules/jquery/dist/jquery.min.js" type="text/javascript"></script>');
                        response.write('<script src="node_modules/lodash/lodash.min.js" type="text/javascript"></script>');
                        response.write('<script src="node_modules/bootstrap-toggle/js/bootstrap-toggle.js" type="text/javascript"></script>');
                        response.write('<script type="text/javascript">');
                        //globals
                        response.write('var cal = {"custom": [], "final": []}; ');

                        //put()
                        response.write('function put(url, data, callback) { $.ajax( url, { type: "POST", dataType: "json", data: JSON.stringify(data), contentType: "text/json", success: function() { if ( callback ) callback(true); }, error  : function() { if ( callback ) callback(false); } });}');

                        //randomId()
                        response.write('function randomId(len) { if( !len || isNaN(len) ) { len = 8; } len = Math.round(len); var text = ""; var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for( var i=0; i < len; i++ ){ text += possible.charAt(Math.floor(Math.random() * possible.length)); }return text;}');

                        // clone()
                        response.write('function clone(obj) { var copy; if (null == obj || "object" != typeof obj) return obj; if (obj instanceof Date) { copy = new Date(); copy.setTime(obj.getTime()); return copy; } if (obj instanceof Array) { copy = []; for (var i = 0, len = obj.length; i < len; i++) { copy[i] = clone(obj[i]); } return copy; } if (obj instanceof Object) { copy = {}; for (var attr in obj) { if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]); } return copy; } throw new Error("Unable to copy obj! Its type is not supported."); }');

                        // READY
                        response.write('$(document).ready(function() { ');

                        // ============================== WRITE VALUE OF CAL.COMBINED TO A REGULAR JAVASCRIPT VARIABLE FOR EDITS ========================================= //
                        response.write('cal.custom = ' + JSON.stringify(clone(cal.combined)) + '; ');
                        response.write('console.log(cal);');

                        response.write('$(".tablerow").mouseover(function(){var item=$(this).attr("rel");$("tr[rel="+item+"]").addClass("hover-row");}); ');
                        response.write('$(".tablerow").mouseout(function(){var item=$(this).attr("rel");$("tr[rel="+item+"]").removeClass("hover-row");}); ');
                        response.write('$(".select-event").change(function() { toggleEvent($(this).attr("id"), $(this).prop("checked"), $(this).attr("rel")); });');
                        response.write('$(".select-all-events").change(function() { toggleAllEvents($(this).prop("checked")); }); ');
                        response.write('});'); // end READY function

                        //toggleSaveButton()
                        response.write('function toggleSaveButton() { if (data_modified == true) { $("#saveButton").removeClass("disabled").removeClass("btn-basic").addClass("btn-success").addClass("glow"); } }');

                        //updateDataItem()
                        response.write('function updateDataItem(eventId, status){ ');
                        response.write('var item = _.find(cal.custom,function(e){return e.Id == eventId });  ');
                        response.write('if( typeof(item != "undefined") ) { ');
                        // response.write('console.log("updating item " + eventId); ');
                        response.write('item.Status = status?"active":"disabled";');
                        // response.write('console.log(_.find(cal.custom,function(e){return e.Id == eventId }).Status);');
                        response.write('} else { console.log("item not found"); }');
                        response.write('}');

                        //toggleEvent()
                        response.write('function toggleEvent(domId, status, eventId) { var parentId = "tablerow-" + domId.split("|")[1]; data_modified = true; toggleSaveButton(); console.log(parentId + " | " + eventId + " | " + status); if( status == true ) { $("tr[rel="+parentId+"]").removeClass("row-off").addClass("row-edit"); $("tr[rel="+parentId+"]").find("select").prop("disabled",false); } else { $("tr[rel="+parentId+"]").removeClass("row-edit").addClass("row-off"); $("tr[rel="+parentId+"]").find("select").prop("disabled","disabled"); } updateDataItem(eventId, status);  }');

                        //toggleAllEvents()
                        response.write('function toggleAllEvents(status) { data_modified = true; toggleSaveButton(); console.log("ALL EVENTS - " + status); if(status==true) { $(".select-event").bootstrapToggle("on"); } else { $(".select-event").bootstrapToggle("off"); } }');

                        //chooseCategory()
                        response.write('function changeCategory(theRow, val) { var parentId = "tablerow-"+val; console.log(theRow + " | " + val); $("tr[rel="+parentId+"]").removeClass("row-off").addClass("row-edit"); }');

                        //callback()
                        response.write('var callback = function(e) { console.log("callback: " + e) };');

                        response.write('function makeData(button) { if($("#"+button).hasClass("disabled") ){console.log("disabled"); } else { ');
                        response.write('console.log(" Let\'s write the file!");');
                        response.write('cal.final = _.reject(clone(cal.custom),function(c){ return c.Status == "disabled" });');
                        response.write('console.log(cal.final.length + " / " + cal.custom.length);');
                        response.write('console.log(cal.final);');
                        // response.write('put(window.location.host +"/updateCalendar",JSON.stringify(cal.final),callback); ');

                        response.write('$("#data").val(JSON.stringify(cal.final)); ');
                        response.write('$("form[name=\'update\']").submit();');

                        response.write(' } }');

                        response.write('</script>');

                        response.write('</body></html>');
                        response.end();

















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











// function put(url, data, callback) {
//     $.ajax( url, {
//         type: 'POST',
//         data: JSON.stringify(data),
//         contentType: 'text/json',
//         success: function() { if ( callback ) callback(true); },
//         error  : function() { if ( callback ) callback(false); }
//     });
// }

//url = window.location.host + '/updateCalendar'