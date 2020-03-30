"use strict";

function pow(x,n) {
    let result=1;
    if (n >= 0) {
      for(let i=n;i;i--) result *=x
    } else {
      for(let i=n;i;i++) result /=x;
    }
    return result;
  }

const log2 = Math.log(2);
  
function mbCalc(p, maxIteration, escapeValue) {
  
  let x2=0;
  let y2=0;
  let w=0;
  let i=0;
  let x=0;
  let y=0;
  while ( x2+y2<=escapeValue && i<maxIteration) {
    x=x2-y2+p.x;
    y=w-x2-y2-p.y;
    x2=x * x;
    y2=y*y;
    w=(x+y) * (x+y);
    i++;
  }
  p.iteration=i;
  //calculate the smoothed iteration
  if ( i < maxIteration) {
    p.smoothedIteration = i+1-Math.log((Math.log(x2+y2)/2)/log2)/log2;
  } else {
    p.smoothedIteration = maxIteration;
  }

  return p;
}

class Point {
  constructor(x,y) {
    this.x = x;
    this.y = y;
    this.iteration=undefined;
    this.smoothedIteration=undefined;
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
    return new Colour(parseInt(string.substring(1,3),16),   
                      parseInt(string.substring(3,5),16),
                      parseInt(string.substring(5),16));
  }
}

class IterationRange {
  constructor(lower, higher) {
    this.lower=lower;
    this.higher=higher;
  }
}

function initPoints(xlower,xhigher,ylower,yhigher,widthPoints,heightPoints)
{
  let w = xhigher - xlower;
  let h = yhigher - ylower;
  let winterval = w / widthPoints;
  let hinterval = h / heightPoints;

  let pointArray = [];

  for (var j=yhigher,ycount=0;ycount<heightPoints; j -=hinterval,ycount++) {
    for (var i=xlower,xcount=0;xcount<widthPoints; i +=winterval, xcount++) {
      pointArray.push(new Point(i,j));
    }
  }
  return pointArray;
}

function calculate(pointArray,maxIteration,f, escapeValue) {
  let lowest = maxIteration;
  let highest = 0;

  for(let i=0;i<pointArray.length;i++) {
    pointArray[i] = f(pointArray[i], maxIteration,escapeValue);
    if (pointArray[i].smoothedIteration < lowest) lowest= pointArray[i].smoothedIteration;
    if (pointArray[i].smoothedIteration > highest) highest= pointArray[i].smoothedIteration;
  }

  return new IterationRange(lowest,highest);
}

// with iteration range 1 to 3 INCLUSIVE (3 slots)
// lowColour - 1 (slot 1)
// 1 slot in between 2 (slot 2)
// highColour - 3 (slot 3)
function createColourRange(lowColour, highColour, iterationRange, maxIterations) {
  let colourMap = new Map();

  //number of colours that we need to generate
  let colourCount = iterationRange.higher-iterationRange.lower;
  //want to make sure that the set is always black
  if (iterationRange.higher==maxIterations) {
    colourCount--;
    colourMap.set(maxIterations,new Colour(0,0,0));
    colourMap.set(iterationRange.higher-1,highColour);   
  } else {
    colourMap.set(iterationRange.higher,highColour);
  }
  let redIncrement=(lowColour.red-highColour.red)/colourCount;
  let blueIncrement=(lowColour.blue-highColour.blue)/colourCount;
  let greenIncrement=(lowColour.green-highColour.green)/colourCount;
 
  for(let i=0;i<colourCount;i++) {
    colourMap.set(iterationRange.lower+i,new Colour(Math.round(lowColour.red-(i*redIncrement)),
                                                    Math.round(lowColour.green-(i*greenIncrement)),                                                
                                                    Math.round(lowColour.blue-(i*blueIncrement))
                                                    ));
  }

  return colourMap;
}

function createRandomColourRange(iterationRange, maxIterations) {
  let colourMap = new Map();

  //number of colours that we need to generate
  let colourCount = iterationRange.higher-iterationRange.lower;

    for(let i=0;i<colourCount;i++) {
      colourMap.set(iterationRange.lower+i,new Colour(Math.floor(Math.random()*255 +1),
      Math.floor(Math.random()*255 +1),                                                
      Math.floor(Math.random()*255 +1)
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
  let colourCount = iterationRange.higher-iterationRange.lower;
    let black = new Colour(0,0,0);
    let white = new Colour(255,255,255);

    for(let i=0;i<colourCount;i++) {
      let c = (i%2) ? white:black;
      colourMap.set(iterationRange.lower+i,c);                                    
    }

  //want to make sure that the set is always black
  if (iterationRange.higher == maxIterations) {
    colourMap.set(maxIterations, black);
  } 
  return colourMap;
}


  /* function ask(question, yes, no) {
    if (confirm(question)) yes()
    else no();
  }
  
  ask(
    "Do you agree?",
    () =>  alert("You agreed.") ,
    () =>  alert("You canceled the execution.")
  ); */

  /*
 * Convert hue-saturation-value/luminosity to RGB.
 *
 * Input ranges:
 *   H =   [0, 360] (integer degrees)
 *   S = [0.0, 1.0] (float)
 *   V = [0.0, 1.0] (float)
 */
function hsv_to_rgb(h, s, v)
{
  if ( v > 1.0 ) v = 1.0;
  var hp = h/60.0;
  var c = v * s;
  var x = c*(1 - Math.abs((hp % 2) - 1));
  var rgb = [0,0,0];

  if ( 0<=hp && hp<1 ) rgb = [c, x, 0];
  if ( 1<=hp && hp<2 ) rgb = [x, c, 0];
  if ( 2<=hp && hp<3 ) rgb = [0, c, x];
  if ( 3<=hp && hp<4 ) rgb = [0, x, c];
  if ( 4<=hp && hp<5 ) rgb = [x, 0, c];
  if ( 5<=hp && hp<6 ) rgb = [c, 0, x];

  var m = v - c;
  rgb[0] += m;
  rgb[1] += m;
  rgb[2] += m;

  rgb[0] *= 255;
  rgb[1] *= 255;
  rgb[2] *= 255;
  return new Colour(rgb[0],rgb[1],rgb[2]);
}