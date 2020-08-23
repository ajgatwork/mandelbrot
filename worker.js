"use strict";


const log2 = Math.log(2);

/*
 * This is the mandelbrot calculation
 */
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

function burningshipCalc(p, maxIteration, escapeValue) {
    let zx = 0;
    let zy = 0;
    let zx2 = 0;
    let zy2 = 0;
    let i=0;

    while(zx2 + zy2 <=escapeValue && i < maxIteration) {
        let xtemp = zx2 - zy2 ;
        zy = 2*Math.abs(zx*zy) + p.y;
        zx = xtemp + p.x;
        zx2 = zx*zx;
        zy2 = zy*zy;
        i++;
    }
    p.iteration = i;
    if (i < maxIteration) {
        p.smoothedIteration = i + 1 - Math.log((Math.log(zx2 + zy2) / 2) / log2) / log2;
        // this is a bit naff - must have something wrong in the equation
        // or it doesnt apply to burning ship?
        if (p.smoothedIteration < 0) p.smoothedIteration=0;
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
    var sectionSize = Math.floor(heightPoints / split);
    //log('split ',heightPoints,' into ',split,' of ',sectionSize,' with ',sectionSize*widthPoints);
    var ycount = splitindex * sectionSize;
    // need to take into account that sectionSize may be rounded down, so last section needs
    // to mop up the last remaining rows
    var yupper;
    if (split - 1 == splitindex) {
        // we are processing the last section
        yupper = heightPoints;
    } else {
        yupper = ycount + sectionSize;
    }

    var j = yhigher - ycount * hinterval;

    for (; ycount < yupper; j -= hinterval, ycount++) {
        for (var i = xlower, xcount = 0; xcount < widthPoints; i += winterval, xcount++) {
            pointArray.push(new Point(i, j));
        }
    }
    return pointArray;
}

/*
 *  For Burning ship the view is traditionally flipped in both the x and y direction
 *
 *  xlower - min x value of the entire picture we are going to render
 *  xhigher -  max x value of the entire picture we are going to render
 *  ylower - min y value of the entire picture we are going to render
 *  yhigher -  max y value of the entire picture we are going to render
 *  widthPoints - number of pixels in each row
 *  heightPoints - number of rows (i.e. height of picture in pixels)
 *  split - number of horizontal sections that we have split the picture into
 *  splitindex - the section we are calculating
 */
function initPointsBySectionInReverse(xlower, xhigher, ylower, yhigher, widthPoints, heightPoints, split, splitindex) {
    let w = xhigher - xlower;
    let h = yhigher - ylower;
    let winterval = w / widthPoints;
    let hinterval = h / heightPoints;

    let pointArray = [];

    //split is the number of sections to divide the picture into.
    // splitindex [0..n] is the section number we are calculating
    // only create pointArray for the section we are looking at
    // need t figure out ycount, yhigher and where to stop
    var sectionSize = Math.floor(heightPoints / split);
    //log('split ',heightPoints,' into ',split,' of ',sectionSize,' with ',sectionSize*widthPoints);
    var ycount = splitindex * sectionSize;
    // need to take into account that sectionSize may be rounded down, so last section needs
    // to mop up the last remaining rows
    var yupper;
    if (split - 1 == splitindex) {
        // we are processing the last section
        yupper = heightPoints;
    } else {
        yupper = ycount + sectionSize;
    }

    var j = ylower + ycount * hinterval;

    for (; ycount < yupper; j += hinterval, ycount++) {
        for (var i = xhigher, xcount = 0; xcount < widthPoints; i -= winterval, xcount++) {
            pointArray.push(new Point(i, j));
        }
    }
    return pointArray;
}

/*
 * Perform the calculation
 * Return the total number of iterations across the points
 */
function calculate(pointArray, maxIteration, f, escapeValue) {
    let total=0;

    for (let i = 0; i < pointArray.length; i++) {
        pointArray[i] = f(pointArray[i], maxIteration, escapeValue);
        total += pointArray[i].iteration;
    }

    return total;
}

var splitindex; //which worker are we?

class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.iteration = undefined;
      this.smoothedIteration = undefined;
    }
  }
  
  class RGBColour {
    constructor(red, green, blue) {
      this.red = red;
      this.green = green;
      this.blue = blue;
      this.alpha = 255;
    }
  
    static convertString(string) {
      // string in format #rrggbb
      return new RGBColour(parseInt(string.substring(1, 3), 16),
        parseInt(string.substring(3, 5), 16),
        parseInt(string.substring(5), 16));
    }
  }
  
  //global const for black
  const BLACK = new RGBColour(0, 0, 0);
  

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
    if (h<0) h=0;
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
    return new RGBColour(rgb[0], rgb[1], rgb[2]);
  }
  
  function rgb_to_hsv(rgbcolour) {
  
    var rgb = [rgbcolour.red,rgbcolour.green,rgbcolour.blue];
    rgb[0] /= 255;
    rgb[1] /= 255;
    rgb[2] /= 255;
    var xmax,xmin;
    var c,v,l,h,s;
  
    if (rgb[0] < rgb[1]) {
      xmin = rgb[0];
      xmax = rgb[1];
    } else {
      xmin = rgb[1];
      xmax = rgb[0];
    }
    if (xmin > rgb[2]) {
      xmin = rgb[2];
    }
    if (xmax < rgb[2]) {
      xmax = rgb[2];
    }
  
    v=xmax;
    c = xmax-xmin;
  
    if (c==0) {
      h = 0;
    } else {
      if (v==rgb[0]) h = 60 * ((rgb[1]-rgb[2])/c);
      if (v==rgb[1]) h = 60 * (2 + (rgb[2]-rgb[0])/c);
      if (v==rgb[2]) h = 60 * (4 + (rgb[0]-rgb[1])/c);
    }
  
    if (v==0) {
      s = 0
    } else {
      s = c/v;
    }
  
    return [h,s,v];
  }

  class ReturnThing {
    constructor(id,start,end, iterationCount, arr){ 
        this.name = id;
        this.start = start;
        this.end = end;
        this.iterationCount = iterationCount;
        this.arr = arr;
    }
}

onmessage = function (e) {
    // e.data contains xmin, xmax, ymin, ymax, canvas.width, canvas.height, escape, maxIterations, split, splitindex, colourEnd, fractal, colourChoice, a, b, c, d
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
    var colourEnd = e.data[10];
    var fractal = e.data[11];
    var colourChoice = e.data[12];
    var cosineColour = e.data[13];
    //var a = e.data[13];
    //var b = e.data[14];
    //var c = e.data[15];
    //var d = e.data[16];
    

    var start = (new Date).getTime();
 
    // calculate the max iteration for each point, and the range
    var fractalfunction ;
    var pointArray
    if (fractal == 'bs') {
        
        pointArray = initPointsBySectionInReverse(xmin, xmax, ymin, ymax, width, height, split, splitindex);
        fractalfunction = burningshipCalc;
    } else {
        fractalfunction = mbCalc;
        pointArray = initPointsBySection(xmin, xmax, ymin, ymax, width, height, split, splitindex);
    }
    var totalIterationCount = calculate(pointArray, maxIterations, fractalfunction, escape);
    var end = (new Date).getTime();

    let colEnd = RGBColour.convertString(colourEnd);
    let hsvColEnd = rgb_to_hsv(colEnd);
    var colourScheme;

    switch (colourChoice) {
      case 'range': colourScheme = t => rangeColours(hsvColEnd,t);
        break;
      case 'cosine': colourScheme = t => cosineColours(cosineColour,t);
        break;
    }




    var arr = new Uint8ClampedArray(pointArray.length * 4);

    for (let i = 0, j = 0; j < pointArray.length; i += 4, j++) {
        let p = pointArray[j];
        //let colour = (maxIterations == p.iteration) ? BLACK : hsv_to_rgb(((360 * p.smoothedIteration / maxIterations)+hsvColEnd[0])%360, hsvColEnd[1], hsvColEnd[2]);
        let colour = (maxIterations == p.iteration) ? BLACK : colourScheme(p.smoothedIteration / maxIterations);
        arr[i] = colour.red; // red
        arr[i + 1] = colour.green;   // green
        arr[i + 2] = colour.blue; // blue
        arr[i + 3] = colour.alpha; // alpha
    }

    // this should pass the arr by reference as Uint8ClampedArray is transferable
    var thing = new ReturnThing(splitindex, start, end, totalIterationCount, arr.buffer);

    this.postMessage(thing, [arr.buffer]);

}

function rangeColours(hsvColEnd,t) {
  return hsv_to_rgb(((360 * t)+hsvColEnd[0])%360, hsvColEnd[1], hsvColEnd[2]);
}

function cosineColours(col,t) {
  return new RGBColour(
    Math.round(255*(col.a.red + col.b.red*Math.cos(6.28318*(col.c.red*t + col.d.red)))),
    Math.round(255*(col.a.green + col.b.green*Math.cos(6.28318*(col.c.green*t + col.d.green)))),
    Math.round(255*(col.a.blue + col.b.blue*Math.cos(6.28318*(col.c.blue*t + col.d.blue))))
  );
}
