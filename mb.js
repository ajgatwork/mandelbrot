"use strict";


const log2 = Math.log(2);

function mbCalc(p, maxIteration, escapeValue) {

  let x2 = 0;
  let y2 = 0;
  let w = 0;
  let i = 0;
  let x = 0;
  let y = 0;
  while (x2 + y2 <= escapeValue && i < maxIteration) {
    x = x2 - y2 + p.x;
    y = w - x2 - y2 - p.y;
    x2 = x * x;
    y2 = y * y;
    w = (x + y) * (x + y);
    i++;
  }
  p.iteration = i;
  //calculate the smoothed iteration
  // see https://en.wikipedia.org/wiki/Plotting_algorithms_for_the_Mandelbrot_set
  if (i < maxIteration) {
    p.smoothedIteration = i + 1 - Math.log((Math.log(x2 + y2) / 2) / log2) / log2;
  } else {
    p.smoothedIteration = maxIteration;
  }

  return p;
}

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.iteration = undefined;
    this.smoothedIteration = undefined;
  }
}

class Colour {
  constructor(red, green, blue) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = 255;
  }

  static convertString(string) {
    // string in format #rrggbb
    return new Colour(parseInt(string.substring(1, 3), 16),
      parseInt(string.substring(3, 5), 16),
      parseInt(string.substring(5), 16));
  }
}

//global const for black
const BLACK = new Colour(0, 0, 0);

class IterationRange {
  constructor(lower, higher) {
    this.lower = lower;
    this.higher = higher;
  }
}

function initPoints(xlower, xhigher, ylower, yhigher, widthPoints, heightPoints) {
  let w = xhigher - xlower;
  let h = yhigher - ylower;
  let winterval = w / widthPoints;
  let hinterval = h / heightPoints;

  let pointArray = [];

  for (var j = yhigher, ycount = 0; ycount < heightPoints; j -= hinterval, ycount++) {
    for (var i = xlower, xcount = 0; xcount < widthPoints; i += winterval, xcount++) {
      pointArray.push(new Point(i, j));
    }
  }
  return pointArray;
}

function calculate(pointArray, maxIteration, f, escapeValue) {
  let lowest = maxIteration;
  let highest = 0;

  for (let i = 0; i < pointArray.length; i++) {
    pointArray[i] = f(pointArray[i], maxIteration, escapeValue);
    if (pointArray[i].iteration < lowest) lowest = pointArray[i].iteration;
    if (pointArray[i].iteration > highest) highest = pointArray[i].iteration;
  }

  return new IterationRange(lowest, highest);
}

// with iteration range 1 to 3 INCLUSIVE (3 slots)
// lowColour - 1 (slot 1)
// 1 slot in between 2 (slot 2)
// highColour - 3 (slot 3)
function createColourRange(lowColour, highColour, iterationRange, maxIterations) {
  let colourMap = new Map();

  //number of colours that we need to generate
  let colourCount = iterationRange.higher - iterationRange.lower;
  //want to make sure that the set is always black
  if (iterationRange.higher == maxIterations) {
    colourCount--;
    colourMap.set(maxIterations, BLACK);
    colourMap.set(iterationRange.higher - 1, highColour);
  } else {
    colourMap.set(iterationRange.higher, highColour);
  }
  let redIncrement = (lowColour.red - highColour.red) / colourCount;
  let blueIncrement = (lowColour.blue - highColour.blue) / colourCount;
  let greenIncrement = (lowColour.green - highColour.green) / colourCount;

  for (let i = 0; i < colourCount; i++) {
    colourMap.set(iterationRange.lower + i, new Colour(Math.round(lowColour.red - (i * redIncrement)),
      Math.round(lowColour.green - (i * greenIncrement)),
      Math.round(lowColour.blue - (i * blueIncrement))
    ));
  }

  return colourMap;
}

function createRandomColourRange(iterationRange, maxIterations) {
  let colourMap = new Map();

  //number of colours that we need to generate
  let colourCount = iterationRange.higher - iterationRange.lower;

  for (let i = 0; i < colourCount; i++) {
    colourMap.set(iterationRange.lower + i, new Colour(Math.floor(Math.random() * 255 + 1),
      Math.floor(Math.random() * 255 + 1),
      Math.floor(Math.random() * 255 + 1)
    ));
  }

  //want to make sure that the set is always black
  if (iterationRange.higher == maxIterations) {
    colourMap.set(maxIterations, new Colour(0, 0, 0));
  }
  return colourMap;
}

function createBandWColourRange(iterationRange, maxIterations) {
  let colourMap = new Map();

  //number of colours that we need to generate
  let colourCount = iterationRange.higher - iterationRange.lower;
  let black = BLACK;
  let white = new Colour(255, 255, 255);

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



/*
* Convert HSV to RGB.
* as per https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
*
* Input ranges:
*   H =   [0, 360] (integer degrees)
*   S = [0.0, 1.0] (float)
*   V = [0.0, 1.0] (float)
*/
function hsv_to_rgb(h, s, v) {
  if (v > 1.0) v = 1.0;
  var hp = h / 60.0;
  var c = v * s;
  var x = c * (1 - Math.abs((hp % 2) - 1));
  var rgb = undefined;

  if (0 <= hp && hp <= 1) rgb = [c, x, 0];
  if (1 < hp && hp <= 2) rgb = [x, c, 0];
  if (2 < hp && hp <= 3) rgb = [0, c, x];
  if (3 < hp && hp <= 4) rgb = [0, x, c];
  if (4 < hp && hp <= 5) rgb = [x, 0, c];
  if (5 < hp && hp <= 6) rgb = [c, 0, x];

  var m = v - c;
  rgb[0] += m;
  rgb[1] += m;
  rgb[2] += m;

  rgb[0] *= 255;
  rgb[1] *= 255;
  rgb[2] *= 255;
  return new Colour(rgb[0], rgb[1], rgb[2]);
}


let highColour = "#000000";
let lowColour = "#ff0000";

function handleHighColourChange(event) {
  highColour = event.target.value;
}

function handleLowColourChange(event) {
  lowColour = event.target.value;
}

// request mousemove events
document.getElementById("box").onmousemove = function (e) { handleMouseMove(e); };
document.getElementById("box").onmousedown = function (e) { handleMouseDown(e); };
document.getElementById("box").onmouseup = function (e) { handleMouseUp(e); };
document.getElementById("go").onclick = function (e) { redraw(e); };
//document.getElementById("highColour").onchange = function (e) { handleHighColourChange(e); };
//document.getElementById("lowColour").onchange = function (e) { handleLowColourChange(e); };

// show tooltip 
function handleMouseMove(e) {
  var position = document.getElementById("position");
  if (e.offsetX < 0 || e.offsetY < 0 || pointArray==undefined) return;
  var point = getPointForPosition(e.offsetX,e.offsetY);
  if (point==undefined) return;

  var text = point.x+ "," + point.y + "  " + point.iteration + "," + point.smoothedIteration;
  position.innerHTML = text;

  if(mousedown) {
    var boxCanvas = document.getElementById("box");
    var boxCtx = boxCanvas.getContext("2d");
    boxCtx.clearRect(0,0,boxCanvas.width,boxCanvas.height); //clear canvas
    boxCtx.strokeStyle = '#FF0000';
    boxCtx.lineWidth = 1;
    boxCtx.strokeRect(mousexStart,mouseyStart,e.clientX-mousexStart,e.clientY-mouseyStart);
  }
}


function getPointForPosition(x,y) {
  return pointArray[x*dpr + (y * dpr* dpr * targetWidth)];
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
  var xl,xh,yl,yh;
  // this is the signal to redraw at the new coordinates
  var cornerStartPoint = getPointForPosition(mousexStart,mouseyStart);
  var cornerEndPoint = getPointForPosition(mousexEnd,mouseyEnd);
  if (cornerEndPoint.x < cornerStartPoint.x)
  {
    xl = cornerEndPoint.x;
    xh = cornerStartPoint.x;
  }  else {
    xh = cornerEndPoint.x;
    xl = cornerStartPoint.x;
  }
  if (cornerEndPoint.y < cornerStartPoint.y)
  {
    yl = cornerEndPoint.y;
    yh = cornerStartPoint.y;
  }  else {
    yh = cornerEndPoint.y;
    yl = cornerStartPoint.y;
  }
  drawNewView(xl,xh,yl,yh);
}

//global variables
var pointArray=undefined;
var dpr = window.devicePixelRatio;

// window.innerWidth
// window.innerHeight
var targetWidth = undefined;
var targetHeight = undefined;
let xmin = undefined;
let xmax = undefined;
let ymin = undefined;
let ymax = undefined;

// given the view the user wants to see, and the size of the
// window, calculate what we are actually going to show!
//
// sets up the global variables
// xmin
// xmax
// ymin
// ymax
function calculateView(xlow, xhigh, ylow, yhigh) {

  //figure out ratio of the window
  targetWidth = window.innerWidth;
  targetHeight = window.innerHeight;
  var windowRatio = targetWidth/targetHeight;

  // if window is taller than wide
  //   fit the width, then scale the height
  if ( windowRatio < 1) {
    xmin = xlow;
    xmax = xhigh;
    var ymid = ylow + (yhigh-ylow)/2;
    ymin = ymid - (xhigh-xlow)/(windowRatio*2);
    ymax = ymid + (xhigh-xlow)/(windowRatio*2);
  }
  else {
    // else
    //   fit the height, then scale the width
    ymin = ylow;
    ymax = yhigh;
    var xmid = xlow + (xhigh-xlow)/2;
    xmin = xmid - windowRatio * (yhigh-ylow)/2;
    xmax = xmid + windowRatio * (yhigh-ylow)/2;
  }

}

function firstload() {
  calculateView(-2,1,-1,1);
  paint();
}

function redraw(e) {
  calculateView(xmin,xmax, ymin,ymax);
  paint();
}

function   drawNewView(xl,xh,yl,yh) {
  calculateView(xl,xh, yl,yh);
  paint();
}


function paint() {

  // determine the pixels to draw
  let maxIterations = Number(document.getElementById('iterations').value);
  let escape = Number(document.getElementById('escape').value);

 
  // create a colour range
  //let lowCol = document.getElementById('lowColour').value;
  //let highCol = document.getElementById('highColour').value;
  //let lowColour = Colour.convertString(lowCol);
  //let highColour = Colour.convertString(highCol);

  //let colourMap = createColourRange(lowColour, highColour,iterationRange,maxIterations);
  //let colourMap = createRandomColourRange(iterationRange, maxIterations);
  //let colourMap = createBandWColourRange(iterationRange, maxIterations);



  // when dpr is > 1 it means that we are on a high DPI monitor.
  // use of canvas pixels on a High DPI device will look very blocky
  // the trick is to create a canvas scaled by dpr, plot the picture
  // then scale to the size you actually want
  // takes more processing power but pictures look a lot better
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = dpr * targetWidth;
  canvas.height = dpr * targetHeight;
  canvas.style.width = targetWidth+"px";
  canvas.style.height = targetHeight+"px";
  ctx.scale(dpr,dpr); //why do we need this at all, doesn't seem to do anything!
  //make the transparent layer on top of myCanvas the same size
  const box = document.getElementById('box');
  const boxCtx = box.getContext('2d');
  box.width = dpr * targetWidth;
  box.height = dpr * targetHeight;
  box.style.width = canvas.style.width;
  box.style.height = canvas.style.height;
  boxCtx.scale(dpr,dpr);

  var start = (new Date).getTime();
  const mySecondImageData = ctx.createImageData(canvas.width, canvas.height);
  pointArray = initPoints(xmin, xmax, ymin, ymax, canvas.width, canvas.height);
  var firstLap = (new Date).getTime();
  // calculate the max iteration for each point, and the range
  var iterationRange = calculate(pointArray, maxIterations, mbCalc, escape);
  var secondLap = (new Date).getTime();
  for (let i = 0, j = 0; i < mySecondImageData.data.length; i += 4, j++) {
    let p = pointArray[j];
    let colour = (maxIterations == p.iteration) ? BLACK : hsv_to_rgb(360.0 * p.smoothedIteration / maxIterations, 1.0, 1.0);// 10.0*p.smoothedIteration/iterations);
    mySecondImageData.data[i] = colour.red; // red
    mySecondImageData.data[i + 1] = colour.green;   // green
    mySecondImageData.data[i + 2] = colour.blue; // blue
    mySecondImageData.data[i + 3] = colour.alpha; // alpha
  }
  ctx.putImageData(mySecondImageData, 0, 0);
  var end = (new Date).getTime();
  var elapsed = end-start;
  document.getElementById('time').innerHTML = elapsed+"ms which is [initPoints:"+(firstLap-start)+"][mbcalc:"+(secondLap-firstLap)+"][render:"+(end-secondLap)+"] "+(targetHeight*targetWidth*dpr*dpr)/(elapsed/1000)+"pixels/second";
} 



  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  document.getElementById( "dragger").onmousedown = dragMouseDown;
  // call a function whenever the cursor moves:
  document.getElementById( "dragger").onmousemove = elementDrag;
  document.getElementById( "dragger").onmouseup = closeDragElement;
  document.getElementById( "dragger").ommouseout = closeDragElement;
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
      var elmnt = document.getElementById( "floating");
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
  }
function closeDragElement() {
  draggerMoving=false;
    //document.getElementById( "dragger").onmouseup = null;
    //document.getElementById( "dragger").onmousemove = null;
  }

window.onload = firstload;
