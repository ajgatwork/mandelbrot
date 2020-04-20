"use strict";

importScripts('utils.js'); 

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

/*
 *  xlower - min x value of the entire picture we are going to render
 *  xhigher -  max x value of the entire picture we are going to render
 *  ylower - min y value of the entire picture we are going to render
 *  yhigher -  max y value of the entire picture we are going to render
 *  widthPoints - number of pixels in each row
 *  heightPoints - number of rows (i.e. height of picture in pixels)
 *  split - number of horizontal sections that we have split the picture into
 *  splitindex - the section we are calculating
 */
function initPointsBySection(xlower, xhigher, ylower, yhigher, widthPoints, heightPoints, split, splitindex) {
    let w = xhigher - xlower;
    let h = yhigher - ylower;
    let winterval = w / widthPoints;
    let hinterval = h / heightPoints;
  
    let pointArray = [];
  
    //split is the number of sections to divide the picture into.
    // splitindex [0..n] is the section number we are calculating
    // only create pointArray for the section we are looking at
    // need t figure out ycount, yhigher and where to stop
    var sectionSize = Math.floor(heightPoints/split);
    //log('split ',heightPoints,' into ',split,' of ',sectionSize,' with ',sectionSize*widthPoints);
    var ycount = splitindex * sectionSize;
    // need to take into account that sectionSize may be rounded down, so last section needs
    // to mop up the last remaining rows
    var yupper;
    if ( split-1 == splitindex) {
        // we are processing the last section
        yupper = heightPoints;
    } else {
        yupper = ycount +  sectionSize;
    }

    var j = yhigher - ycount*hinterval;

    for (; ycount < yupper; j -= hinterval, ycount++) {
      for (var i = xlower, xcount = 0; xcount < widthPoints; i += winterval, xcount++) {
        pointArray.push(new Point(i, j));
      }
    }
    return pointArray;
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

  var splitindex; //which worker are we?
  
/*
 * Need to look at speeding up transfer of data from worker to main thread.
 * and also moving work out of the main thread.
 * 
 * Uint8ClampedArray is a TypedArray which is an ArrayBuffer which is transferable!
 * so should be transferable from worker to main thread with no copying.
 * 
 * Uint8ClampedArray is input to image data
 * 
 * but, how do we move points from thread to main???
 * 
 * for full view of mandelbrot doing web workers is super slow, 
 * but the advantages are defintely seen the more you zoom in
 */


  onmessage = function(e) {
    // e.data contains xmin, xmax, ymin, ymax, canvas.width, canvas.height, escape, maxIterations, split, splitindex
    var xmin = e.data[0];
    var xmax = e.data[1];
    var ymin = e.data[2];
    var ymax = e.data[3];
    var width = e.data[4];
    var height = e.data[5];
    var escape = e.data[6];
    var maxIterations = e.data[7];
    var split = e.data[8];
    splitindex = e.data[9];
    
    var start = (new Date).getTime();
    var pointArray = initPointsBySection(xmin, xmax, ymin, ymax, width, height,split,splitindex);
    
    // calculate the max iteration for each point, and the range
    var iterationRange = calculate(pointArray, maxIterations, mbCalc, escape);
    var end = (new Date).getTime();
    var thing = new ReturnThing(splitindex, pointArray, start,end);
    console.log(splitindex," worker.js finished in ",end-start);
    this.postMessage(thing);
    
  }