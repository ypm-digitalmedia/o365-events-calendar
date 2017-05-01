/* GLOBAL VARIABLES */

var screenType = "portrait"; // "portrait" | "landscape"
var screenTargetRatio = 16 / 9;
var bgColor = "#73b0c7";
var weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var calendarDataJSON = [];

var pagesNumber;
var pagesData;

var foobar;
var testballs;

/* ========================= */

$(document).on("ready", function() {

    var vid = document.getElementById("bgvid");
    // var pauseButton = document.querySelector("#content button");





    // if (window.matchMedia('(prefers-reduced-motion)').matches) {
    //     vid.removeAttribute("autoplay");
    //     vid.pause();
    //     // pauseButton.innerHTML = "Paused";
    // }

    // function vidFade() {
    //     vid.classList.add("stopfade");
    // }

    // vid.addEventListener('ended', function() {
    //     // only functional if "loop" is removed 
    //     vid.pause();
    //     // to capture IE10
    //     vidFade();
    // });





    // pauseButton.addEventListener("click", function() {
    //     vid.classList.toggle("stopfade");
    //     if (vid.paused) {
    //         vid.play();
    //         pauseButton.innerHTML = "Pause";
    //     } else {
    //         vid.pause();
    //         pauseButton.innerHTML = "Paused";
    //     }
    // })

    function gcd(a, b) {
        return (b == 0) ? a : gcd(b, a % b);
    }

    function outputSizes() {
        var w = $(window).width();
        var h = $(window).height();
        var r = gcd(h, w);
        var ratio = h / w;
        var delta = getRatioDelta(ratio, 0);
        var deltaDec = parseFloat(delta / 100);
        console.log(delta + " | " + 255 * (delta / 100))
        var html = "Dimensions: <strong>" + w + "</strong> x <strong>" + h + "</strong><br />";
        html += "Screen Type: <strong>" + screenType + "</strong><br />";
        html += "Aspect Ratio: <strong>" + h / r + " : " + w / r + "</strong> ";
        html += "( " + "<strong>" + delta + "%</strong>)";
        $("#report").html(html);
    }

    function stretchVideoHorizontally() {

    }

    function getRatioDelta(ratio, float) {
        var absdelta = Math.abs(ratio - screenTargetRatio);
        var delta = absdelta;
        var f;

        if (!float) {
            f = 0;
        } else {
            f = parseInt(float);
        }
        return (delta * 100).toFixed(float);

    }



    function todaysDate(filter) {
        var d = new Date();

        var year = d.getFullYear();
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + d.getDate()).slice(-2);

        var today = year + "-" + month + "-" + day;
        // var filtertoday = "Start/DateTime ge '" + today + "T00:00:00'";
        var filtertoday = "End/DateTime ge '" + today + "T00:00:00' and Start/DateTime le '2022-01-01T00:00:00'";


        if (filter && typeof(filter) != "undefined") {
            return filtertoday;
        } else {
            return today;
        }
    }



    $(window).resize(function() {
        // outputSizes();
        // stretchVideoHorizontally();
    });




    function addZero(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }

    function removeZero(i) {
        if (i < 10) {
            i = parseInt(i.slice(-1));
        }


        return i;
    }


    function niceAmPm(hour, minute) {

        if (hour > 12) {
            hour -= 12;
            suffix = " pm";
        } else if (hour == 12) {
            suffix = " pm";
        } else {
            suffix = " am";
        }
        return hour + ":" + minute + suffix;
    }

    function twelveHourTime(hour) {
        return parseInt(hour > 12 ? hour - 12 : hour);
    }

    // ============ ON LOAD FUNCTIONS ============== //

    var nd = '../data/newest.json';
    var td = '../data/caldata_' + todaysDate() + '.json';

    $.getJSON(nd, function(file) {

        console.log("reading from " + file);

        td = "../data/" + file.newestFile;
        // alert(nd + "\n" + td)

        $.getJSON(td, function(data) {
            var items = { "all": [], "today": [], "upcoming": [] };
            // $.each( data, function( key, val ) {
            //     items.push( "{"+ key + ":" + val + "}" );
            // });

            // console.log(items);
            // console.log(data);
            calendarDataJSON = data;

            for (var i = 0; i < calendarDataJSON.length; i++) {
                var theEvent = calendarDataJSON[i];
                var theStartTime = new Date(theEvent.Start.DateTime);
                var theEndTime = new Date(theEvent.End.DateTime);

                var theStart = {
                    day: weekdays[theStartTime.getDay()],
                    date: addZero(theStartTime.getDate()),
                    dateNoZero: theStartTime.getDate(),
                    month: addZero(theStartTime.getMonth() + 1),
                    monthNoZero: theStartTime.getMonth() + 1,
                    monthName: months[theStartTime.getMonth()],
                    year: theStartTime.getFullYear(),
                    hour: addZero(theStartTime.getHours()),
                    hourTwelve: twelveHourTime(theStartTime.getHours()),
                    minute: addZero(theStartTime.getMinutes()),
                    datetime: theStartTime
                };


                var theEnd = {
                    day: weekdays[theEndTime.getDay()],
                    date: addZero(theEndTime.getDate()),
                    dateNoZero: theStartTime.getDate(),
                    month: addZero(theEndTime.getMonth() + 1),
                    monthNoZero: theStartTime.getMonth() + 1,
                    monthName: months[theEndTime.getMonth()],
                    year: theEndTime.getFullYear(),
                    hour: addZero(theEndTime.getHours()),
                    hourTwelve: twelveHourTime(theStartTime.getHours()),
                    minute: addZero(theEndTime.getMinutes()),
                    datetime: theEndTime
                };

                var item = {
                    start: theStart,
                    end: theEnd,
                    subject: theEvent.Subject,
                    organizer: theEvent.Organizer.EmailAddress.Name,
                    location: theEvent.Location.DisplayName,
                    category: theEvent.Categories,
                    body: theEvent.Body.Content
                };

                items.all.push(item);
                if (isToday(moment(theStartTime))) {
                    items.today.push(item);
                } else {
                    // ignore items from the past
                    if (daysAway(theStartTime) > 0) {
                        items.upcoming.push(item);
                    }
                }

                var eventHTML = "<div class='eventItem'>";
                eventHTML += "<h2>" + item.subject + "</h2>";
                eventHTML += "<h3>" + item.start.day + ", " + item.start.monthName + " " + item.start.date + "<br />";
                eventHTML += niceAmPm(removeZero(item.start.hour), item.start.minute) + " &ndash; " + niceAmPm(removeZero(item.end.hour), item.end.minute) + "</h3>";
                // eventHTML += removeZero(item.start.hour) + ":" + item.start.minute + " &ndash; " + removeZero(item.end.hour) + ":" + item.end.minute + "</h3>";
                eventHTML += "</div>";
                // $("#events").append(eventHTML);
            }

            pagesNumber = 1;

            console.log(items);

            // Make today's events
            if (items.today.length > 0) {

                //TODAY
                var itemsOnPage = 1;
                items.today.forEach(function(t) {

                    if (itemsOnPage > 4) {
                        pagesNumber++;
                        itemsOnPage = 1;
                    }
                    console.log("\n" + pagesNumber + "|" + itemsOnPage + " | TODAY'S EVENT: " + t.subject)
                    var eventHTML = "<div class='event-item'>";
                    eventHTML += "<img src='../media/dots/dot.png' class='dot' />";
                    eventHTML += "<h1 class='time'>" + t.start.hourTwelve + ":" + t.start.minute + "</h1>";
                    eventHTML += "<h2>" + t.subject + "</h2>";
                    eventHTML += "<h3>" + t.category + "</h3>";
                    eventHTML += "<p>" + buildBodyString(t.body) + "</p>";
                    eventHTML += "</div>";
                    // push event into page


                    $("#page" + pagesNumber).append(eventHTML);
                    itemsOnPage++;
                });

                //UPCOMING
                itemsOnPage = 1;
                pagesNumber = 4;
                items.upcoming.forEach(function(u) {

                    if (itemsOnPage > 4) {
                        pagesNumber++;
                        itemsOnPage = 1;
                    }


                    var da = daysAway(u.start.datetime);
                    var d = u.start.day.toLowerCase();

                    //check if event is tomorrow
                    if (da == 1) {
                        var dotImg = "<img src='../media/dots/dot_tomorrow.png' class='dot' />";
                        var dateHeading = "<h1 class='date'>&nbsp;</h1>";
                        var tomorrowString = " (TOMORROW)";
                    } else if (da > 6) {
                        //event is more than a week away
                        var dotImg = "<img src='../media/dots/dot_" + d + ".png' class='dot' />";
                        var dateHeading = "<h1 class='date'>" + u.start.monthNoZero + "/" + u.start.dateNoZero + "</h1>";
                        var tomorrowString = "";
                    } else {
                        //event is this week!
                        var dotImg = "<img src='../media/dots/dot_" + d + ".png' class='dot />";
                        var dateHeading = "<h1 class='event'>&nbsp;</h1>"
                        var tomorrowString = "";
                    }


                    console.log("\n" + pagesNumber + "|" + itemsOnPage + " | UPCOMING event" + tomorrowString + ": " + u.subject + " - " + u.start.day + ", " + u.start.monthNoZero + "/" + u.start.dateNoZero + " @ " + niceAmPm(removeZero(u.start.hour), u.start.minute) + " (" + da + " days away)");

                    var eventHTML = "<div class='event-item'>";
                    eventHTML += dotImg;
                    eventHTML += dateHeading;
                    eventHTML += "<h2>" + u.subject + "</h2>";
                    eventHTML += "<h3>" + niceAmPm(removeZero(u.start.hour), u.start.minute) + "&mdash;" + niceAmPm(removeZero(u.end.hour), u.end.minute) + "</h3>";
                    eventHTML += "<p>" + buildBodyString(u.body) + "</p>";
                    eventHTML += "</div>";
                    // push event into page

                    if (pagesNumber <= 8) {
                        $("#page" + pagesNumber).append(eventHTML);
                    }
                    itemsOnPage++;
                });

                // REMOVE EMPTY PAGES
                $(".page").each(function(iter, page) {
                    if ($(this).children().length < 1) {
                        $(this).remove();
                        $("#bullets li").eq(iter + 1).remove();
                        length--;
                    }
                })


            }


            /*
                        <div class="page page-today page1" rel="today">
                            <div class="event-item">
                                <img src="../media/dot.png" class="dot" />
                                <h2>Gallery Talk</h2>
                                <h3>Atlantic Adventures with Eric Laso-Wasem</h3>
                                <h3>4:00 in David Friend Hall</h3>
                                <p>Refreshments will be served</p>
                            </div>
                        </div>
            */



        });
    })




    // $("#peabody").fitText(1);
    $(window).trigger("resize");










    // ============================================= //

}); // End ready function


function buildBodyString(body) {

    var bodyStringHTML = '';
    var bodyStringText = '';
    if (body) {

        if (body.hasOwnProperty("Content")) {
            bodyStringHTML = body.Content.toString();
            // extract only the inner HTML from the <body> tag of the message content
        } else {
            bodyStringHTML = body.toString();
        }
        bodyStringText = bodyStringHTML.match(/<body[^>]*>[\s\S]*<\/body>/gi);

    }
    // console.log(bodyStringText);
    return bodyStringText;
}

function isToday(inputTime) {
    return inputTime.isSame(new Date(), "day");
}

function checkWindowOrientation() {
    if (screenType != "portrait" && screenType != "landscape") {
        screenType = "portrait";
    }
}

function animationOut(i) {}

function animationIn(i) {}
//well, you need modify the cubeTransition.js file
//delete the two functions if you dont need this kind of animation.

function qs(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function daysAway(event) {
    var a = moment(event);
    var b = moment(new Date());
    return parseInt(a.diff(b, 'days')) + 1;
}