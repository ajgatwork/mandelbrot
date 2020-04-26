
function pointsAreEqual(p1,p2) {
  return (p1.x==p2.x && p1.y==p2.y && p1.iteration==p2.iteration)
}
describe("mbCalc tests", function() {

  it("should escape after 1 iterations", function() {
    let p1=new Point(3,3);
    let p1Expected = new Point(3,3);
    p1Expected.iteration=1;
    assert.equal(pointsAreEqual(mbCalc(p1,1000,4),p1Expected), true);
    assert.equal(pointsAreEqual(mbCalc(p1,1,4),p1Expected), true);    
    let p2=new Point(3,1);
    let p2Expected = new Point(3,1);
    p2Expected.iteration=1;
    assert.equal(pointsAreEqual(mbCalc(p2,1,4),p2Expected), true);
  })

  it("should never escape", function() {
    let p1=new Point(0,0);
    let p1Expected = new Point(0,0);
    p1Expected.iteration=1000;
    assert.equal(pointsAreEqual(mbCalc(p1,1000,4),p1Expected), true);
  })
});



describe("Init points for javascript canvas", function() {

  it("test intervals", function() {
    let pArray = initPointsBySection(-1,1,-1,1,2,2,1,0);

    assert.equal(Array.isArray(pArray),true);
    assert.equal(pArray.length,4);
    assert.equal(pointsAreEqual(pArray[0],new Point(-1,1)),true);
    assert.equal(pointsAreEqual(pArray[1],new Point(0,1)),true);
    assert.equal(pointsAreEqual(pArray[2],new Point(-1,0)),true);
    assert.equal(pointsAreEqual(pArray[3],new Point(0,0)),true);
  });

});

function tester(p,maxIterations,escape) {
  p.iteration = p.x+p.y+maxIterations;
  return p;
}

describe("Generic calculate", function() {

  it("test intervals", function() {
    let pArray = initPointsBySection(-1,1,-1,1,2,2,1,0);
    let iterationCount = calculate(pArray,3,tester,1000);

    let resultsArray = [];
    let p0=new Point(-1,1);
    p0.iteration=-1+1+3;
    resultsArray.push(p0);
    let p1=new Point(0,1);
    p1.iteration=0+1+3;
    resultsArray.push(p1);
    let p2=new Point(-1,0);
    p2.iteration=-1+0+3;
    resultsArray.push(p2);
    let p3=new Point(0,0);
    p3.iteration=0+0+3;
    resultsArray.push(p3);

    var expectedIterationCount = p0.iteration+p1.iteration+p2.iteration+p3.iteration;
    assert.equal(iterationCount,expectedIterationCount);
    assert.equal(Array.isArray(pArray),true);
    assert.equal(pArray.length,resultsArray.length);
    for(let i=0;i<resultsArray.length;i++) {

      assert.equal(pointsAreEqual(pArray[i],resultsArray[i]),true);
    }

  });

});

function coloursEqual(colour1, colour2) {
  return (colour1.red == colour2.red && colour2.blue==colour1.blue && colour1.green==colour2.green && colour1.alpha==colour2.alpha);
}

describe("Colour conversion", function() {

  it("converts string correctly", function() {
    let white="#ffffff";
    let colourWhite = new RGBColour(255,255,255);
    let black="#000000";
    let colourBlack = new RGBColour(0,0,0);

    assert.equal(coloursEqual(RGBColour.convertString(white),colourWhite),true);
    assert.equal(coloursEqual(RGBColour.convertString(black),colourBlack),true);

  });



  function arraysEqual(arr1,arr2) {

    // if length is not equal 
    if(arr1.length!=arr2.length) 
      return false; 
    else { 
      for(var i=0;i<arr1.length;i++) {
      if(arr1[i]!=arr2[i]) return false;
      }
    }
    return true; 
  }
  
  it("rgb to hsv conversion", function() {
    
    let cyan = [180,1,1];
    let rgbcyan = new RGBColour(0,255,255);
    assert.equal(arraysEqual(rgb_to_hsv(rgbcyan),cyan), true);

    let red = [0,1,1];
    let rgbred = new RGBColour(255,0,0);
    assert.equal(arraysEqual(rgb_to_hsv(rgbred),red), true);

    let black = [0,0,0];
    let rgbblack = new RGBColour(0,0,0);
    assert.equal(arraysEqual(rgb_to_hsv(rgbblack),black), true);

    let white = [0,0,1];
    let rgbwhite = new RGBColour(255,255,255);
    assert.equal(arraysEqual(rgb_to_hsv(rgbwhite),white), true);

    let magenta = [270,1,1];
    let rgbmagenta = RGBColour.convertString('#8000ff');
    let result = rgb_to_hsv(rgbmagenta);
    // have to account for rounding errors
    assert.equal(Math.floor(result[0]),magenta[0]);
    assert.equal(result[1],magenta[1]);
    assert.equal(result[2],magenta[2]);
    console.log();
  });
});

