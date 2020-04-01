
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
    let pArray = initPoints(-1,1,-1,1,2,2);

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
    let pArray = initPoints(-1,1,-1,1,2,2);
    let iterationRange = calculate(pArray,3,tester,1000);

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

    let expectedIterationRange = new IterationRange(2,4);

    assert.equal(expectedIterationRange.lower,iterationRange.lower);
    assert.equal(expectedIterationRange.higher,iterationRange.higher);

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
    let colourWhite = new Colour(255,255,255);
    let black="#000000";
    let colourBlack = new Colour(0,0,0);

    assert.equal(coloursEqual(Colour.convertString(white),colourWhite),true);
    assert.equal(coloursEqual(Colour.convertString(black),colourBlack),true);

  });




  it("creates colour Range, no black", function() {
    
    let lowColour = new Colour(2,2,2);
    let highColour = new Colour(0,0,0);
    let iterationRange = new IterationRange(1,3);

    let colourMap = createColourRange(lowColour, highColour,iterationRange,1000);

    let colourTwo = new Colour(1,1,1);

    assert.equal(colourMap.size, 3);
    assert.equal(coloursEqual(lowColour,colourMap.get(1)),true);
    assert.equal(coloursEqual(colourTwo,colourMap.get(2)),true);
    assert.equal(coloursEqual(highColour,colourMap.get(3)),true);


  });


  it("creates colour Range with black", function() {
    
    let lowColour = new Colour(2,2,2);
    let highColour = new Colour(1,1,1);
    let black = new Colour(0,0,0);
    let iterationRange = new IterationRange(1,3);

    let colourMap = createColourRange(lowColour, highColour,iterationRange,3);

    assert.equal(colourMap.size, 3);
    assert.equal(coloursEqual(lowColour,colourMap.get(1)),true);
    assert.equal(coloursEqual(highColour,colourMap.get(2)),true);
    assert.equal(coloursEqual(black,colourMap.get(3)),true);


  });
});

