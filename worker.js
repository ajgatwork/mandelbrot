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

  
  onmessage = function(e) {
    // e.data contains xmin, xmax, ymin, ymax, canvas.width, canvas.height, escape, maxIterations
    var xmin = e.data[0];
    var xmax = e.data[1];
    var ymin = e.data[2];
    var ymax = e.data[3];
    var width = e.data[4];
    var height = e.data[5];
    var escape = e.data[6];
    var maxIterations = e.data[7];
    
    console.log("initpoints");
    var pointArray = initPoints(xmin, xmax, ymin, ymax, width, height);
    
    // calculate the max iteration for each point, and the range
    var iterationRange = calculate(pointArray, maxIterations, mbCalc, escape);
    console.log("pointArray is of length"+pointArray.length);
    this.postMessage(pointArray);
    
  }