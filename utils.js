"use strict";

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
  
  class IterationRange {
    constructor(lower, higher) {
      this.lower = lower;
      this.higher = higher;
    }
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

  class Timings {

    constructor() {
      this.start = (new Date).getTime();
      this.initPoints = undefined;
      this.mbCalc = undefined;
      this.render = undefined;
    }
  
    recordInit() {
      this.initPoints = (new Date).getTime();
    }
  
    recordMbCalc() {
      this.mbCalc = (new Date).getTime();
    }
  
    recordRender() {
      this.render = (new Date).getTime();
    }
  
    getInitTime() {
      return this.initPoints - this.start;
    }
  
    getCalcTime() {
      return this.mbCalc - this.initPoints;
    }
  
    getRenderTime() {
      return this.render - this.mbCalc;
    }
  
    getTotalTime() {
      return this.render - this.start;
    }
  }