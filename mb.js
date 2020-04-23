"use strict";






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
    colourMap.set(iterationRange.lower + i, new RGBColour(Math.round(lowColour.red - (i * redIncrement)),
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


function handleMouseMove(e) {
  // show position information on debug box 
  if (e.offsetX < 0 || e.offsetY < 0) return;
  var point = getPointForPosition(e.offsetX, e.offsetY);
  if (point == undefined) return;
  var position = document.getElementById("position");
  var text = point.x + "," + point.y + "  " + point.iteration + "," + point.smoothedIteration;
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

// TODO - NEED TO sort out this as we dont get pointarray any more....
function getPointForPosition(x, y) {
  // pointArray is an array of arrays
  // size of pointArray is workercount - this represents the number of sections
  // the picture has been split into
  var targetPixel = x * dpr + (y * dpr * dpr * targetWidth);
  var i=0;
  while(targetPixel > pointArray[i].length) {
    targetPixel -= pointArray[i].length;
    i++;
  }
  var a = pointArray[i];
  return a[targetPixel];
}

function resetPointArray() {
  pointArray = new Array(workercount)
}

function allPointsReturnedByWorkers() {
  for(var i=0;i<pointArray.length;i++) {
    if (pointArray[i] == undefined) {
      return false;
    }
  }
  return true;
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
var dpr = window.devicePixelRatio;

// window.innerWidth
// window.innerHeight
var targetWidth = undefined;
var targetHeight = undefined;
let xmin = undefined;
let xmax = undefined;
let ymin = undefined;
let ymax = undefined;
var iterationRange;
var timings;
let maxIterations;
var mySecondImageData;

var workercount = 16;
var workers = [];

for(var k=0;k<workercount;k++) {
  var myWorker = new Worker("worker.js");
  myWorker.onmessage = function(e) {
    // get data back - we get a ReturnThing
    var ret = (new Date).getTime();
    console.log(e.data.name,' transfer took ',ret - e.data.end);
    //pointArray[e.data.name] = e.data.points;
    paint(e.data.name,new Uint8ClampedArray(e.data.arr));
  }
  workers.push(myWorker);
}

// pointArray is an array of arrays
var pointArray;

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

    // guess the number of iterations that will give the best picture
    // 130 * (x-span)^-0.3263
    // this has problems with infinity, so need to find a reasonable limit
    maxIterations = Math.round(130 * Math.pow(xmax-xmin,-0.3263));
    if (maxIterations>50000) maxIterations=50000;
    mySecondImageData = ctx.createImageData(canvas.width, canvas.height);

    resetPointArray();

}

function firstload() {
  calculateView(-2, 1, -1, 1);
  handofftoworker();

}

function redraw(e) {
  calculateView(xmin, xmax, ymin, ymax);
  handofftoworker();
}

function drawNewView(xl, xh, yl, yh) {
  calculateView(xl, xh, yl, yh);
  handofftoworker();
}





function handofftoworker() {
  let escape = Number(document.getElementById('escape').value);
  const canvas = document.getElementById('myCanvas');
  for(var p=0;p<workers.length;p++) {
    // e.data contains xmin, xmax, ymin, ymax, canvas.width, canvas.height, escape, maxIterations
    var input = [xmin,xmax,ymin,ymax, canvas.width, canvas.height, escape,maxIterations,workers.length,p];
    myWorker.postMessage(input);
  }

}

function paint(section, array) {

  performance.mark('startpaint'+section);

  const colourEnd = document.getElementById('colourend').value;
  let colEnd = RGBColour.convertString(colourEnd);
  let hsvColEnd = rgb_to_hsv(colEnd);


  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');

  //practice copying the array buffer
  // if I can get this working then cann move the colour workings out
  // to the worker, transfer the arraybuffer and remove the pointsArrray copying
  // this should be faster
  // then need to change the way the zoom box works to calculate the zoom area...


    // workercount is the number of sections to divide the picture into.
    // section [0..n] is the section number we have points for
    // only need to render points for this section 
    // need to figure out where to start in the image data array
    var sectionSize = Math.floor(canvas.height/workercount);
    var joffset = section * sectionSize;
    var istart = joffset * 4 * canvas.width;
    var iupper = istart + (sectionSize*4*canvas.width);

    for (let i = istart, j = 0; j < array.length; i++, j++) {
     mySecondImageData.data[i] = array[j];
    } 

  ctx.putImageData(mySecondImageData, 0, 0);


  performance.mark('endpaint'+section);
  performance.measure('measure-'+section,'startpaint'+section,'endpaint'+section);
  console.log(section,' paint ',performance.getEntriesByName('measure-'+section)[0].duration);
  updateDisplay();
}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
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

  document.getElementById('iterations').value = maxIterations;
  document.getElementById('span').innerHTML = "span: " + (xmax-xmin) + " x " + (ymax-ymin);
  document.getElementById('positionxl').innerHTML = "xmin: " + xmin;
  document.getElementById('positionxh').innerHTML = "xmax: " + xmax;
  document.getElementById('positionyl').innerHTML = "ymin: " + ymin;
  document.getElementById('positionyh').innerHTML = "ymax: " + ymax;

  //document.getElementById('breakdown').innerHTML = timings.getTotalTime() + "ms which is [initPoints:" + timings.getInitTime() + "][mbcalc:" + timings.getCalcTime() + "][render:" + timings.getRenderTime() + "]";
  //document.getElementById('rate').innerHTML = formatNumber(((targetHeight * targetWidth * dpr * dpr) / (timings.getTotalTime() / 1000)).toFixed(0)) + "pixels/second"
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

window.onload = firstload;

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
