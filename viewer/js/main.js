/* GLOBAL VARIABLES */

var screenType = "portrait";    // "portrait" | "landscape"
var screenTargetRatio = 16/9;
var bgColor = "#73b0c7";
var weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

var calendarDataJSON = [];

/* ========================= */

$(document).on("ready",function(){
    
    var vid = document.getElementById("bgvid");
    var pauseButton = document.querySelector("#content button");

    if (window.matchMedia('(prefers-reduced-motion)').matches) {
        vid.removeAttribute("autoplay");
        vid.pause();
        pauseButton.innerHTML = "Paused";
    }

    function vidFade() {
        vid.classList.add("stopfade");
    }

    vid.addEventListener('ended', function() {
        // only functional if "loop" is removed 
        vid.pause();
        // to capture IE10
        vidFade();
    }); 


    pauseButton.addEventListener("click", function() {
        vid.classList.toggle("stopfade");
        if (vid.paused) {
            vid.play();
            pauseButton.innerHTML = "Pause";
        } else {
            vid.pause();
            pauseButton.innerHTML = "Paused";
        }
    })

    function gcd (a, b) {
        return (b == 0) ? a : gcd (b, a%b);
    }

    function outputSizes() {
        var w = $(window).width();
        var h = $(window).height();
        var r = gcd (h,w);
        var ratio = h/w;
        var delta = getRatioDelta(ratio,0);
        var deltaDec = parseFloat(delta/100);
        console.log(delta+ " | " + 255*(delta/100))
        var html = "Dimensions: <strong>" + w + "</strong> x <strong>" + h + "</strong><br />";
            html += "Screen Type: <strong>" + screenType + "</strong><br />";
            html += "Aspect Ratio: <strong>" + h/r + " : " + w/r + "</strong> ";
            html+= "( " +  "<strong>"+delta+"%</strong>)";
        $("#report").html(html);
    }

    function stretchVideoHorizontally() {

    }

    function getRatioDelta(ratio,float) {
        var absdelta = Math.abs(ratio-screenTargetRatio);
        var delta = absdelta;
        var f;

        if( !float ) {
            f = 0;    
        } else {
            f = parseInt(float);
        }
        return (delta*100).toFixed(float);
        
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



    $(window).resize(function(){
        outputSizes();
        stretchVideoHorizontally();
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


    // ============ ON LOAD FUNCTIONS ============== //

    var td = '../data/caldata_' + todaysDate() + '.json';

    $.getJSON( td, function( data ) {
        var items = [];
        // $.each( data, function( key, val ) {
        //     items.push( "{"+ key + ":" + val + "}" );
        // });
        
        // console.log(items);
        console.log(data);
        calendarDataJSON = data;

        for( var i=0; i<3; i++ ) {
            var theEvent = calendarDataJSON[i];
            var theStartTime = new Date(theEvent.Start.DateTime);
            var theEndTime = new Date(theEvent.End.DateTime);
            
            var theStart = {
                day : weekdays[theStartTime.getDay()],
                date : addZero(theStartTime.getDate()),
                month : addZero(theStartTime.getMonth()),
                monthName : months[theStartTime.getMonth()],
                year : theStartTime.getFullYear(),
                hour : addZero(theStartTime.getHours()),
                minute : addZero(theStartTime.getMinutes())
            };

            var theEnd = {
                day : weekdays[theEndTime.getDay()],
                date : addZero(theEndTime.getDate()),
                month : addZero(theEndTime.getMonth()),
                monthName : months[theEndTime.getMonth()],
                year : theEndTime.getFullYear(),
                hour : addZero(theEndTime.getHours()),
                minute : addZero(theEndTime.getMinutes())
            };

            var item = {
                start : theStart,
                end : theEnd,
                subject : theEvent.Subject,
                organizer : theEvent.Organizer.EmailAddress.Name,
                location : theEvent.Location.DisplayName
            };

            items.push(item);

            console.log(items);

            var eventHTML = "<div class='eventItem'>";
                eventHTML += "<h2>" + item.subject + "</h2>";
                eventHTML += "<h3>" + item.start.day + ", " + item.start.monthName + " " + item.start.date + "<br />";
                eventHTML += removeZero(item.start.hour) + ":" + item.start.minute + " &ndash; " + removeZero(item.end.hour) + ":" + item.end.minute + "</h3>";
                eventHTML += "</div>";
            $("#events").append(eventHTML);
        }

    });


    $("#peabody").fitText(1);
    $(window).trigger("resize");

    // ============================================= //

}); // End ready function













function checkWindowOrientation() {
    if( screenType != "portrait" && screenType != "landscape" ) {
        screenType = "portrait";
    }
}