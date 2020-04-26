"use strict";



function createRandomColourRange(iterationRange, maxIterations) {
  let colourMap = new Map();

  //number of colours that we need to generate
  let colourCount = iterationRange.higher - iterationRange.lower;

  for (let i = 0; i < colourCount; i++) {
    colourMap.set(iterationRange.lower + i, new RGBColour(Math.floor(Math.random() * 255 + 1),
      Math.floor(Math.random() * 255 + 1),
      Math.floor(Math.random() * 255 + 1)
    ));
  }

  //want to make sure that the set is always black
  if (iterationRange.higher == maxIterations) {
    colourMap.set(maxIterations, new RGBColour(0, 0, 0));
  }
  return colourMap;
}

function createBandWColourRange(iterationRange, maxIterations) {
  let colourMap = new Map();

  //number of colours that we need to generate
  let colourCount = iterationRange.higher - iterationRange.lower;
  let black = BLACK;
  let white = new RGBColour(255, 255, 255);

  for (let i = 0; i < colourCount; i++) {
    let c = (i % 2) ? white : black;
    colourMap.set(iterationRange.lower + i, c);
  }

  //want to make sure that the set is always black
  if (iterationRange.higher == maxIterations) {
    colourMap.set(maxIterations, black);
  }
  return colourMap;
}


// request mousemove events
document.getElementById("box").onmousemove = function (e) { handleMouseMove(e); };
document.getElementById("box").onmousedown = function (e) { handleMouseDown(e); };
document.getElementById("box").onmouseup = function (e) { handleMouseUp(e); };
document.getElementById("go").onclick = function (e) { 
  var radiobutton;
  if (document.getElementById('fractalmb').checked ) {
    radiobutton = MANDELBROT;
  } else {
    radiobutton = BURNING_SHIP;
  }
  if (radiobutton==fractalType) {
    // just redraw the current fractaltype, current view, but with new iterations/colours
    redraw(e); 
  } else {
    if (radiobutton==MANDELBROT) {
      firstLoadMandelbrot()
    } else {
      firstLoadBurningShip();
    }
  }

};

// still need to sort out the rest/go buttons. dont work properly when
// switching between fractals
document.getElementById("reset").onclick = function (e) { 
  if (  document.getElementById('fractalmb').checked ) {
    firstLoadMandelbrot();
  } else{
    firstLoadBurningShip();
  }
 };

function handleMouseMove(e) {
  // show position information on debug box 
  if (e.offsetX < 0 || e.offsetY < 0) return;
  var point = getPointForPosition(e.offsetX, e.offsetY);
  if (point == undefined) return;
  var position = document.getElementById("position");
  var text = point.x + "," + point.y;
  position.innerHTML = text;

  //draw the selection area
  if (mousedown) {
    var boxCanvas = document.getElementById("box");
    var boxCtx = boxCanvas.getContext("2d");
    boxCtx.clearRect(0, 0, boxCanvas.width, boxCanvas.height); //clear canvas
    boxCtx.strokeStyle = '#FF0000';
    boxCtx.lineWidth = 1;
    boxCtx.strokeRect(mousexStart, mouseyStart, e.clientX - mousexStart, e.clientY - mouseyStart);
  }
}

/*
 * Get the x,y coordinates for a given screen position
 *
 * inputs - xscreen - number of pixels to the right from the top left corner
 *          yscreen - number of pixels down from the top left corner
 */
function getPointForPosition(xscreen, yscreen) {
    // figure out the ratio of mouse position to the canvas, for x and y
    var xratio = xscreen / targetWidth;
    var yratio = yscreen / targetHeight;
    var x,y;
  if (fractalType==BURNING_SHIP) {
    // this is rendered so that x and y axis are mirrored
    x = xmax - (xmax - xmin) * xratio;
    y = ymin + (ymax - ymin) * yratio;
  } else {
    x = xmin + (xmax - xmin) * xratio;
    y = ymax - (ymax - ymin) * yratio;
  }




  return new Point(x, y);
}


var mousexStart = 0;
var mouseyStart = 0;
var mousedown = false;

function handleMouseDown(e) {
  mousexStart = e.clientX;
  mouseyStart = e.clientY;
  mousedown = true;
}

function handleMouseUp(e) {
  mousedown = false;
  var mousexEnd = e.clientX;
  var mouseyEnd = e.clientY;
  var xl, xh, yl, yh;
  // this is the signal to redraw at the new coordinates
  var cornerStartPoint = getPointForPosition(mousexStart, mouseyStart);
  var cornerEndPoint = getPointForPosition(mousexEnd, mouseyEnd);
  if (cornerEndPoint.x < cornerStartPoint.x) {
    xl = cornerEndPoint.x;
    xh = cornerStartPoint.x;
  } else {
    xh = cornerEndPoint.x;
    xl = cornerStartPoint.x;
  }
  if (cornerEndPoint.y < cornerStartPoint.y) {
    yl = cornerEndPoint.y;
    yh = cornerStartPoint.y;
  } else {
    yh = cornerEndPoint.y;
    yl = cornerStartPoint.y;
  }
  drawNewView(xl, xh, yl, yh);
}



//global variables
// device pixel ratio - number of real pixels on the sreen that a web browser canvas represents
// value greater than 1 means you are a high resolution screen
var dpr = window.devicePixelRatio;

// width and height, in browser pixels, of the image we should render
var targetWidth = undefined;
var targetHeight = undefined;
// the area that we are going to plot
let xmin = undefined;
let xmax = undefined;
let ymin = undefined;
let ymax = undefined;
// the number of iterations of the calculation to execute before giving up
let maxIterations;

// the fractal type that is currently being shown
const MANDELBROT = 'mb';
const BURNING_SHIP = 'bs';
var fractalType;

// the time at which calculation/rendering started
var startTime;

// this is the colour assigned to iteration=0 i.e. fartherst away from the mandelbrot set
var colourEnd;

// set the number of background workers to be the same as the hardware threads/cpus
// or if on Safari it defaults to 4
var workercount = navigator.hardwareConcurrency || 8;
var workers = [];

var workerStatus = new Array(workercount);

var iterationTotalCount;

function resetStatus() {
  for (var i = 0; i < workerStatus.length; i++)
    workerStatus[i] = 0;
}

function recordFinished(worker) {
  workerStatus[worker] = 1;
}

function workerCompleteCount() {
  var c = 0;
  for (var i = 0; i < workerStatus.length; i++) {
    c += workerStatus[i];
  }
  return c
}

/*
 * Throw away the workers that we used last time and create some new ones.
 * Found that on Safari the picture rendered properly every time, but on
 * chrome that often some of the workers wouldnt return and would just
 * spin CPU.  Creating new workers seems to fix this.
 */
function initialiseWorkers() {
  while(workers.length) {
    var worker = workers.pop();
    worker.terminate(); // need some error condition here

  }

  for (var k = 0; k < workercount; k++) {
    var myWorker = new Worker("worker.js");
    myWorker.onmessage = function (e) {
      // get data back - we get a ReturnThing
      recordFinished(e.data.name);
      iterationTotalCount+=e.data.iterationCount;
      renderImageSection(e.data.name, new Uint8ClampedArray(e.data.arr));
    }
    workers.push(myWorker);
  }
}

class ReturnThing {
  constructor(id,start,end,arr){ 
      this.name = id;
      this.start = start;
      this.end = end;
      this.arr = arr;
  }
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.iteration = undefined;
    this.smoothedIteration = undefined;
  }
}

function startTiming() {
  startTime = (new Date).getTime();
}

/*
 * Zoom in to a box with the current dimensions, initialise all global variables
 * ready for calculation.
 */
function initialiseForView(xlow, xhigh, ylow, yhigh) {

  //figure out ratio of the window
  targetWidth = window.innerWidth;
  targetHeight = window.innerHeight;
  var windowRatio = targetWidth / targetHeight;

  // if window is taller than wide
  //   fit the width, then scale the height
  if (windowRatio < 1) {
    xmin = xlow;
    xmax = xhigh;
    var ymid = ylow + (yhigh - ylow) / 2;
    ymin = ymid - (xhigh - xlow) / (windowRatio * 2);
    ymax = ymid + (xhigh - xlow) / (windowRatio * 2);
  }
  else {
    // else
    //   fit the height, then scale the width
    ymin = ylow;
    ymax = yhigh;
    var xmid = xlow + (xhigh - xlow) / 2;
    xmin = xmid - windowRatio * (yhigh - ylow) / 2;
    xmax = xmid + windowRatio * (yhigh - ylow) / 2;
  }

  // when dpr is > 1 it means that we are on a high DPI monitor.
  // use of canvas pixels on a High DPI device will look very blocky
  // the trick is to create a canvas scaled by dpr, plot the picture
  // then scale to the size you actually want
  // takes more processing power but pictures look a lot better
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = dpr * targetWidth;
  canvas.height = dpr * targetHeight;
  canvas.style.width = targetWidth + "px";
  canvas.style.height = targetHeight + "px";
  ctx.scale(dpr, dpr); //why do we need this at all, doesn't seem to do anything!
  //make the transparent layer on top of myCanvas the same size
  const box = document.getElementById('box');
  const boxCtx = box.getContext('2d');
  box.width = dpr * targetWidth;
  box.height = dpr * targetHeight;
  box.style.width = canvas.style.width;
  box.style.height = canvas.style.height;
  boxCtx.scale(dpr, dpr);

  var checkbox = document.getElementById('autoiterations');
  var iterations = document.getElementById('iterations');

  if (checkbox.checked) {
    // guess the number of iterations that will give the best picture
    // 130 * (x-span)^-0.3263
    // this has problems with infinity, so need to find a reasonable limit
    maxIterations = Math.round(130 * Math.pow(xmax - xmin, -0.3263));
    if (maxIterations > 50000) maxIterations = 50000;
  } else {
    maxIterations = iterations.value;
  }
  //reset the total count of iterations
  iterationTotalCount = 0;

  // move this here ready to reinstate the colour setting
  colourEnd = document.getElementById('colourend').value;

  initialiseWorkers();
  resetStatus();
  startTiming();
}

function firstLoadMandelbrot() {
  document.getElementById('colourend').value="#ff0000";
  document.getElementById('autoiterations').checked=true;
  document.getElementById('escape').value=4;
  document.getElementById('fractalmb').checked=true;
  fractalType=MANDELBROT;
  initialiseForView(-2, 1, -1, 1);
  handofftoworker();
}

function firstLoadBurningShip() {
  document.getElementById('colourend').value="#ff0000";
  document.getElementById('autoiterations').checked=false;
  document.getElementById('iterations').value=64;
  document.getElementById('escape').value=4;
  document.getElementById('fractalbs').checked=true;
  fractalType=BURNING_SHIP;
  initialiseForView(-2, 2, -2, 1);
  handofftoworker();
}

function redraw(e) {
  initialiseForView(xmin, xmax, ymin, ymax);
  handofftoworker();
}

function drawNewView(xl, xh, yl, yh) {
  initialiseForView(xl, xh, yl, yh);
  handofftoworker();
}

function handofftoworker() {
  let escape = Number(document.getElementById('escape').value);
  const canvas = document.getElementById('myCanvas');
  var fractal = 'mb';
  if (document.getElementById('fractalbs').checked) {
    fractal='bs';
  }
  for (var p = 0; p < workers.length; p++) {
    // e.data contains xmin, xmax, ymin, ymax, canvas.width, canvas.height, escape, maxIterations, split, splitindex, colourEnd, fractal
    var input = [xmin, xmax, ymin, ymax, canvas.width, canvas.height, escape, maxIterations, workers.length, p, colourEnd, fractal];
    workers[p].postMessage(input);
  }

}

 function renderImageSection(section, array) {


  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');

  // workercount is the number of sections to divide the picture into.
  // section [0..n] is the section number we have points for
  // only need to render points for this section 
  // need to figure out where to start in the image data array
  var sectionSize = Math.floor(canvas.height / workercount);
  var joffset = section * sectionSize;

  var imagePart = new ImageData(array, canvas.width);

  ctx.putImageData(imagePart, 0, joffset);
  updateDisplay();
}

function formatNumber(num) {
  // notation and compactDisplay dont quite work in Safari yet...
  return new Intl.NumberFormat('en-GB', { notation: "compact" , compactDisplay: "short" }).format(num);
  //return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function updateDisplay() {
  /*
      <p>position</p>
    <p id="positionxl"></p>
    <p id="positionxh"></p>
    <p id="positionyl"></p>
    <p id="positionyh"></p>
    <p>Iterations</p>
    <p id="iterationMin"></p>
    <p id="iterationMax"></p>
    <p>Timings</p>
    <p id="breakdown"></p>
    <p id="rate"></p>    
    */
  

  var zoomLevel = 4/(xmax-xmin);
  
  document.getElementById('zoom').innerHTML = formatNumber(zoomLevel);
  document.getElementById('span').innerHTML = "span: " + (xmax - xmin) + " x " + (ymax - ymin);
  document.getElementById('positionxl').innerHTML = "xmin: " + xmin;
  document.getElementById('positionxh').innerHTML = "xmax: " + xmax;
  document.getElementById('positionyl').innerHTML = "ymin: " + ymin;
  document.getElementById('positionyh').innerHTML = "ymax: " + ymax;

  var now = (new Date).getTime();
  //calculate approximate time to render picture up to this point
  var pixelsInImage = dpr*dpr*targetHeight*targetWidth;
  var roughIdeaOfPixelsGenerated = workerCompleteCount() * pixelsInImage / workercount;
  var pixelRate = (roughIdeaOfPixelsGenerated / ((now-startTime) / 1000)).toFixed(0);
  var iterationRate = iterationTotalCount/((now-startTime)/1000);
  document.getElementById('rate').innerHTML = formatNumber(pixelRate) + " pixels/second, "+formatNumber(iterationRate)+" iterations/second ("+workerCompleteCount()+"/"+workercount+")";
}

var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

document.getElementById("dragger").onmousedown = dragMouseDown;
// call a function whenever the cursor moves:
document.getElementById("dragger").onmousemove = elementDrag;
document.getElementById("dragger").onmouseup = closeDragElement;
document.getElementById("dragger").ommouseout = closeDragElement;
var draggerMoving = false;

function dragMouseDown(e) {
  e = e || window.event;
  e.preventDefault();
  // get the mouse cursor position at startup:
  pos3 = e.clientX;
  pos4 = e.clientY;
  //document.getElementById( "dragger").onmouseup = closeDragElement;
  draggerMoving = true;

}

function elementDrag(e) {
  if (draggerMoving) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    var elmnt = document.getElementById("floating");
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }
}
function closeDragElement() {
  draggerMoving = false;
  //document.getElementById( "dragger").onmouseup = null;
  //document.getElementById( "dragger").onmousemove = null;
}

window.onload = firstLoadBurningShip;

/*
 * Data to figure out how to automatically choose the right iterations to get a good picture
 *
 *   Assumption is that the width/height of the view is inversely proportional to iterations
 *   All with escape value 4
 *   2 x 2                   iterations 100
 *   0.09 * 0.08             iterations 300-400
 *   0.00579 * 0.00508       iterations 700-800
 *   0.00037011473155007524 x 0.0003250389126743247    iterations 1800-2000
 *   0.00002446045355491977 x 0.00002148144493929749   iterations  4000-4300
 *
 *   Line fit to this data: iterations = 130 * (x-span)^-0.3263
 */
