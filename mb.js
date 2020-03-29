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

  
function mbCalc(x0,y0, maxIteration) {
  let x2=0;
  let y2=0;
  let w=0;
  let i=0;

  while ( x2+y2<=4 && i<maxIteration) {
    let x=x2-y2+x0;
    let y=w-x2-y2-y0;
    x2=x * x;
    y2=y*y;
    w=(x+y) * (x+y);
    i++;
  }
  return i;
}

class Point {
  constructor(x,y) {
    this.x = x;
    this.y = y;
    this.iteration=undefined;
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

function calculate(pointArray,maxIteration,f) {
  let lowest = maxIteration;
  let highest = 0;

  for(let i=0;i<pointArray.length;i++) {
    pointArray[i].iteration = f(pointArray[i].x, pointArray[i].y, maxIteration);
    if (pointArray[i].iteration < lowest) lowest= pointArray[i].iteration;
    if (pointArray[i].iteration > highest) highest= pointArray[i].iteration;
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


  /* function ask(question, yes, no) {
    if (confirm(question)) yes()
    else no();
  }
  
  ask(
    "Do you agree?",
    () =>  alert("You agreed.") ,
    () =>  alert("You canceled the execution.")
  ); */
