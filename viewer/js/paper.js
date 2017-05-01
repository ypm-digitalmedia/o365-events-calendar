var options = {

    numBalls: 6,
    minRadius: 100,
    maxRadius: 250,
    colors: [
        { h: 187, s: 0.28, b: 0.68 },
        { h: 191, s: 0.15, b: 0.84 },
        { h: 195, s: 0.42, b: 0.76 },
        { h: 208, s: 0.54, b: 0.64 },
        { h: 208, s: 0.59, b: 0.79 },
        { h: 209, s: 1.00, b: 0.46 },
        { h: 225, s: 0.40, b: 0.36 },
        { h: 180, s: 1.00, b: 0.82 },
        { h: 216, s: 0.17, b: 0.93 },
        { h: 203, s: 0.85, b: 0.78 }
    ],
    react: false,

};


function Ball(r, p, v) {
    this.radius = r;
    this.point = p;
    this.vector = v;
    this.maxVec = 15;
    this.numSegment = Math.floor(r / 3 + 2);
    this.boundOffset = [];
    this.boundOffsetBuff = [];
    this.sidePoints = [];

    var randColor = _.sample(options.colors);
    // console.log(randColor)
    this.path = new Path({
        // fillColor: {
        //     hue: Math.random() * 360,
        //     saturation: 1,
        //     brightness: 1
        // },
        fillColor: {
            hue: randColor.h,
            saturation: randColor.s,
            brightness: randColor.b
        },
        blendMode: 'lighter'
    });

    for (var i = 0; i < this.numSegment; i++) {
        this.boundOffset.push(this.radius);
        this.boundOffsetBuff.push(this.radius);
        this.path.add(new Point());
        this.sidePoints.push(new Point({
            angle: 360 / this.numSegment * i,
            length: 1
        }));
    }
}

Ball.prototype = {
    iterate: function() {
        this.checkBorders();
        if (this.vector.length > this.maxVec)
            this.vector.length = this.maxVec;
        this.point += this.vector;
        this.updateShape();
    },

    checkBorders: function() {
        var size = view.size;
        if (this.point.x < -this.radius)
            this.point.x = size.width + this.radius;
        if (this.point.x > size.width + this.radius)
            this.point.x = -this.radius;
        if (this.point.y < -this.radius)
            this.point.y = size.height + this.radius;
        if (this.point.y > size.height + this.radius)
            this.point.y = -this.radius;
    },

    updateShape: function() {
        var segments = this.path.segments;
        for (var i = 0; i < this.numSegment; i++)
            segments[i].point = this.getSidePoint(i);

        this.path.smooth();
        for (var i = 0; i < this.numSegment; i++) {
            if (this.boundOffset[i] < this.radius / 4)
                this.boundOffset[i] = this.radius / 4;
            var next = (i + 1) % this.numSegment;
            var prev = (i > 0) ? i - 1 : this.numSegment - 1;
            var offset = this.boundOffset[i];
            offset += (this.radius - offset) / 15;
            offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
            this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
        }
    },

    react: function(b) {
        var dist = this.point.getDistance(b.point);
        if (dist < this.radius + b.radius && dist != 0) {
            var overlap = this.radius + b.radius - dist;
            var direc = (this.point - b.point).normalize(overlap * 0.015);
            this.vector += direc;
            b.vector -= direc;

            this.calcBounds(b);
            b.calcBounds(this);
            this.updateBounds();
            b.updateBounds();
        }
    },

    getBoundOffset: function(b) {
        var diff = this.point - b;
        var angle = (diff.angle + 180) % 360;
        return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
    },

    calcBounds: function(b) {
        for (var i = 0; i < this.numSegment; i++) {
            var tp = this.getSidePoint(i);
            var bLen = b.getBoundOffset(tp);
            var td = tp.getDistance(b.point);
            if (td < bLen) {
                this.boundOffsetBuff[i] -= (bLen - td) / 2;
            }
        }
    },

    getSidePoint: function(index) {
        return this.point + this.sidePoints[index] * this.boundOffset[index];
    },

    updateBounds: function() {
        for (var i = 0; i < this.numSegment; i++)
            this.boundOffset[i] = this.boundOffsetBuff[i];
    }
};

//--------------------- main ---------------------

var balls = [];

for (var i = 0; i < options.numBalls; i++) {
    var position = Point.random() * view.size;
    var vector = new Point({
        angle: 360 * Math.random(),
        length: Math.random() * 10
    });
    var radius = Math.random() * 60 + 60;
    var radius2 = _.random(options.minRadius, options.maxRadius);
    // console.log(radius2);
    balls.push(new Ball(radius2, position, vector));
}

function onFrame() {
    if (options.react === true) {
        for (var i = 0; i < balls.length - 1; i++) {
            for (var j = i + 1; j < balls.length; j++) {
                balls[i].react(balls[j]);
            }
        }
    }
    for (var i = 0, l = balls.length; i < l; i++) {
        balls[i].iterate();
    }
}