var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var cw = canvas.width = window.innerWidth,
  cx = cw / 2;
var ch = canvas.height = window.innerHeight,
  cy = ch / 2;

// Theme-dependent colors for animation
let animationStrokeStyle = '#ccc'; // Default for light mode
let animationFillStyle = '#000';   // Default for light mode

// Function to be called by theme switcher
window.setAnimationTheme = function(isDark) {
    if (isDark) {
        animationStrokeStyle = '#444444'; // Lines in dark mode
        animationFillStyle = '#666666';   // Points in dark mode
    } else {
        animationStrokeStyle = '#ccc';    // Lines in light mode
        animationFillStyle = '#000';    // Points in light mode
    }
    // If animation is already running, you might want to force a redraw here
    // or ensure the next frame uses the new colors immediately.
    // For this script, colors are checked per frame or on Init(), so it should be fine.
};

ctx.fillStyle = "#000"; // This will be immediately overridden by animationFillStyle in drawing logic
var linesNum = 16;
var linesRy = [];
var requestId = null;

function Line(flag) {
  this.flag = flag;
  this.a = {};
  this.b = {};
  if (flag == "v") {
    this.a.y = 0;
    this.b.y = ch;
    this.a.x = randomIntFromInterval(0, ch);
    this.b.x = randomIntFromInterval(0, ch);
  } else if (flag == "h") {
    this.a.x = 0;
    this.b.x = cw;
    this.a.y = randomIntFromInterval(0, cw);
    this.b.y = randomIntFromInterval(0, cw);
  }
  this.va = randomIntFromInterval(25, 100) / 100;
  this.vb = randomIntFromInterval(25, 100) / 100;

  this.draw = function() {
    ctx.strokeStyle = animationStrokeStyle; // Use theme-dependent color
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.stroke();
  }

  this.update = function() {
    if (this.flag == "v") {
      this.a.x += this.va;
      this.b.x += this.vb;
    } else if (flag == "h") {
      this.a.y += this.va;
      this.b.y += this.vb;
    }

    this.edges();
  }

  this.edges = function() {
    if (this.flag == "v") {
      if (this.a.x < 0 || this.a.x > cw) {
        this.va *= -1;
      }
      if (this.b.x < 0 || this.b.x > cw) {
        this.vb *= -1;
      }
    } else if (flag == "h") {
      if (this.a.y < 0 || this.a.y > ch) {
        this.va *= -1;
      }
      if (this.b.y < 0 || this.b.y > ch) {
        this.vb *= -1;
      }
    }
  }

}

for (var i = 0; i < linesNum; i++) {
  var flag = i % 2 == 0 ? "h" : "v";
  var l = new Line(flag);
  linesRy.push(l);
}

function Draw() {
  requestId = window.requestAnimationFrame(Draw);
  ctx.clearRect(0, 0, cw, ch);

  for (var i = 0; i < linesRy.length; i++) {
    var l = linesRy[i];
    l.draw();
    l.update();
  }
  for (var i = 0; i < linesRy.length; i++) {
    var l = linesRy[i];
    for (var j = i + 1; j < linesRy.length; j++) {
      var l1 = linesRy[j]
      Intersect2lines(l, l1);
    }
  }
}

function Init() {
  linesRy.length = 0;
  for (var i = 0; i < linesNum; i++) {
    var flag = i % 2 == 0 ? "h" : "v";
    var l = new Line(flag);
    linesRy.push(l);
  }

  if (requestId) {
    window.cancelAnimationFrame(requestId);
    requestId = null;
  }

  cw = canvas.width = window.innerWidth;
  cx = cw / 2;
  ch = canvas.height = window.innerHeight;
  cy = ch / 2;

  // Set initial animation colors based on current theme
  // This check should ideally happen after the main script has determined the theme
  // However, if this script runs before DOMContentLoaded for main.js, isDarkMode might not be set yet.
  // For safety, we check body class directly, assuming main.js has run initTheme on DOMContentLoaded.
  if (document.body.classList.contains('dark-mode')) {
    window.setAnimationTheme(true);
  } else {
    window.setAnimationTheme(false);
  }

  Draw();
};

// Expose Init to global scope
window.initCanvasAnimation = Init;

// Initial call to Init, can be slightly delayed to ensure canvas is ready and theme is set.
setTimeout(function() {
  Init();
  addEventListener('resize', Init, false);
}, 15); // Original delay was 15, can be adjusted if needed.

function Intersect2lines(l1, l2) {
  var p1 = l1.a,
    p2 = l1.b,
    p3 = l2.a,
    p4 = l2.b;
  var denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
  var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;
  var x = p1.x + ua * (p2.x - p1.x);
  var y = p1.y + ua * (p2.y - p1.y);
  if (ua > 0 && ub > 0) {
    markPoint({
      x: x,
      y: y
    })
  }
}

function markPoint(p) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
  ctx.fillStyle = animationFillStyle; // Use theme-dependent color
  ctx.fill();
}

function randomIntFromInterval(mn, mx) {
  return ~~(Math.random() * (mx - mn + 1) + mn);
} 
