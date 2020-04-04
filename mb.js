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
document.getElementById("myCanvas").onmousemove = function (e) { handleMouseMove(e); };
document.getElementById("myCanvas").onmouseout = function (e) { handleMouseOut(e); };
document.getElementById("go").onclick = function (e) { paint(e); };
document.getElementById("highColour").onchange = function (e) { handleHighColourChange(e); };
document.getElementById("lowColour").onchange = function (e) { handleLowColourChange(e); };

// show tooltip 
function handleMouseMove(e) {
  var canvas = document.getElementById('myCanvas');
  var tipCanvas = document.getElementById("tip");
  var tipCtx = tipCanvas.getContext("2d");
  if (e.offsetX < 0 || e.offsetY < 0 || pointArray==undefined) return;
  var point = getPointForPosition(e.offsetX,e.offsetY,canvas.width);
  tipCanvas.style.left = (e.offsetX + 20) + "px";
  tipCanvas.style.top = e.offsetY + "px";
  tipCtx.clearRect(0, 0, tipCanvas.width, tipCanvas.height);
  tipCtx.fillText(point.x+ "," + point.y + "  " + point.iteration + "," + point.smoothedIteration, 5, 15);
}

function handleMouseOut(e) {
  var tipCanvas = document.getElementById("tip");
  tipCanvas.style.left = "-400px";
}

function getPointForPosition(x,y,width) {
  return pointArray[x + (y * width)];
}


//global variables
var pointArray=undefined;

function paint(e) {

  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  const myImageData = ctx.createImageData(canvas.width, canvas.height);

  // determine the pixels to draw
  let xmin = Number(document.getElementById('xmin').value);
  let xmax = Number(document.getElementById('xmax').value);
  let ymin = Number(document.getElementById('ymin').value);
  let ymax = Number(document.getElementById('ymax').value);
  let maxIterations = Number(document.getElementById('iterations').value);
  let escape = Number(document.getElementById('escape').value);

  pointArray = initPoints(xmin, xmax, ymin, ymax, canvas.width, canvas.height);
  // calculate the max iteration for each point, and the range
  let iterationRange = calculate(pointArray, maxIterations, mbCalc, escape);

  // create a colour range
  let lowCol = document.getElementById('lowColour').value;
  let highCol = document.getElementById('highColour').value;
  let lowColour = Colour.convertString(lowCol);
  let highColour = Colour.convertString(highCol);

  //let colourMap = createColourRange(lowColour, highColour,iterationRange,maxIterations);
  //let colourMap = createRandomColourRange(iterationRange, maxIterations);
  //let colourMap = createBandWColourRange(iterationRange, maxIterations);

  for (let i = 0, j = 0; i < myImageData.data.length; i += 4, j++) {
    let p = pointArray[j];

    let colour = (maxIterations == p.iteration) ? BLACK : hsv_to_rgb(360.0 * p.smoothedIteration / maxIterations, 1.0, 1.0);// 10.0*p.smoothedIteration/iterations);
    myImageData.data[i] = colour.red; // red
    myImageData.data[i + 1] = colour.green;   // green
    myImageData.data[i + 2] = colour.blue; // blue
    myImageData.data[i + 3] = colour.alpha; // alpha
  }

  ctx.putImageData(myImageData, 0, 0);
} 