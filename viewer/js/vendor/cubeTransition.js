var slideTypes;
var activeSlideType = null;
var previousSlideType = null;
var slideTypeImages = {
    "today": "../media/todays_events_1080.png",
    "upcoming": "../media/upcoming_events_1080.png"
}

var length;
var outClass;
var inClass;
var current;
var next;
var onGoing;


function alertSlideNum(prev, act) {
    // console.log("previous: " + prev + " | " + "active: " + act);
}

function transitionSlideType() {
    previousSlideType = activeSlideType;
    activeSlideType = $(".page.visible").attr("rel");
    if (activeSlideType != "upcoming" && activeSlideType != "today") {
        activeSlideType == "upcoming";
    }

    var theTypeImg = $("#headline img");

    //theTypeImg.attr("src"));

    //../media/todays_events_1080.png

    if (previousSlideType != activeSlideType) {
        theTypeImg.attr("src", slideTypeImages[activeSlideType]);
    }


    alertSlideNum(previousSlideType, activeSlideType);
}

(function($) {

    slideTypes = [];

    length = $('#cubeTransition>div').length;

    current = 1,
        next = 1,
        onGoing = false;
    $('#cubeTransition>div:eq(0)').addClass('visible');

    for (i = 0; i < length; i++) {
        var bullet = $("<li></li>");
        if (i == 0) bullet.addClass('active');
        $("#bullets").append(bullet);


        if (i == 0 || i == 1) { slideTypes[i] = "today"; } else { slideTypes[i] = "upcoming"; }

    }

    function openIndex(i) {

        if (!onGoing && next != i) {
            onGoing = true;
            next = i
            outClass = current > i ? 'rotateCubeBottomOut' : 'rotateCubeTopOut'
            inClass = current > i ? 'rotateCubeBottomIn' : 'rotateCubeTopIn';
            show()
        }
    }

    function trans(direction) {
        if (!onGoing) {
            onGoing = true;
            if (direction == 'up') {
                next = current > 1 ? current - 1 : length;
                outClass = 'rotateCubeBottomOut';
                inClass = 'rotateCubeBottomIn';
            } else {
                next = current < length ? current + 1 : 1;
                outClass = 'rotateCubeTopOut';
                inClass = 'rotateCubeTopIn';
            }
            show();
        }
    }

    function show() {
        $('#cubeTransition>div:eq(' + (next - 1) + ')').addClass('visible');
        $('#cubeTransition>div:eq(' + (current - 1) + ')').addClass(outClass);
        $('#cubeTransition>div:eq(' + (next - 1) + ')').addClass(inClass);
        $('#bullets>li:eq(' + (current - 1) + ')').removeClass('active');
        $('#bullets>li:eq(' + (next - 1) + ')').addClass('active');

        setTimeout(function() {

        }, 50)

        animationOut(current - 1)
        setTimeout(function() {
            $('#cubeTransition>div:eq(' + (current - 1) + ')').removeClass('visible');
        }, 500)

        setTimeout(function() {
            $('#cubeTransition>div:eq(' + (current - 1) + ')').removeClass(outClass);
            $('#cubeTransition>div:eq(' + (next - 1) + ')').removeClass(inClass);

            animationIn(next - 1)
            current = next;
            onGoing = false;
            transitionSlideType();
        }, 600)
    }

    $(document).ready(

        function() {

            transitionSlideType();

            $(document).mousewheel(function(e, delta) {
                e.preventDefault();
                if (delta < 0) {
                    trans('down')
                } else {
                    trans('up')
                }
            });
            $(document).keydown(function(e) {
                if (e.keyCode == 38 || e && e.keyCode == 37) {
                    trans('up')
                }
                if (e.keyCode == 39 || e && e.keyCode == 40) {
                    trans('down')
                }

            });

            $(document).swipe({
                swipe: function(event, direction, distance, duration, fingerCount) {
                    if (direction == "up") {
                        trans('down')
                    } else if (direction == "down") {
                        trans('up')
                    }
                }
            });


            $('#bullets>li').on('click', function() {
                openIndex($(this).index() + 1);
            });

        });
})(jQuery);