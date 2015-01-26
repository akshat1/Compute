var should = require('chai').should();
var C      = require('../dist/compute-debug.js');

//TODO: _isObservable, _unwrap, _isValid, _gather
//TODO: $stop, $resume

// Test Observables
describe('#observable', function(){
  var firstValue  = 'test value 0';
  var secondValue = 'test value 1';

  it('gets the original value of the observable', function(){
    var obs1 = C.o(firstValue);
    obs1().should.equal(firstValue);
  });

  it('gets the value we just set', function(){
    var obs2 = C.o(firstValue);
    obs2(secondValue);
    obs2().should.equal(secondValue);
  });

});


describe('#observable array', function(){

  it('tests that observable array creation for non-valid input', function(){
    var caughtError = null;
    try {
      var oA = C.oa('blah');
    }catch(err){
      caughtError = err;
    }
    caughtError.toString().should.equal('Error: Argument to observable array must be null, undefined or Array');
  });

  it('tests that observable array succeeds for null input', function(){
    var oA = C.oa();
    var arr = oA();
    (arr instanceof Array).should.equal(true);
    arr.length.should.equal(0);
  });

  it('tests that observable array succees for array input', function(){
    var srcArray = [1, 2, 3];
    var oA = C.oa(srcArray);
    var arr = oA();
    arr.should.equal(srcArray);
  });

  it('tests that array observable honors subscribe on setting value', function(){
    var oa1 = C.oa();
    var tmp = null;
    oa1.subscribe(function(v){
      tmp = v;
    });

    var testArr1 = [1, 2, 3];
    oa1(testArr1);
    tmp.should.equal(testArr1);
    oa1().should.equal(testArr1);

    var testArr2 = [4, 5, 6];
    oa1(testArr2);
    tmp.should.equal(testArr2);
  });

  it('tests that array observable honors subscribe on push/pop', function(){
    var testArr = [1, 2, 3];
    var oa1 = C.oa(testArr);
    var tmp = null;
    oa1.subscribe(function(v){
      tmp = v.join('x');
    });

    oa1.push(4);
    tmp.should.equal('1x2x3x4');

    oa1.pop();
    tmp.should.equal('1x2x3');
  });

  it('tests array observable peek', function(){
    var testArr = [1, 2, 3];
    var oa1 = C.oa(testArr);
    var tmp = -1;
    oa1.subscribe(function(v){
      tmp = v.join('x');
    });
    var peekedValue = oa1.peek();
    tmp.should.equal(-1);
    peekedValue.should.equal(3);
  });
});


describe('#from', function(){
  it('verifies that $from works with preset source observables using $fire', function(){
    var obsP1 = C.o(3);
    var obsP2 = C.o(4);
    var obsP3 = C.from(obsP1, obsP2, function(a, b){
      return Math.sqrt(a*a + b*b);
    });
    obsP3.$fire();
    obsP3().should.equal(5);
  });

  it('verifies that $from changes with source observables being changed', function(){
    var obsP1 = C.o(3);
    var obsP2 = C.o(4);
    var obsP3 = C.from(obsP1, obsP2, function(a, b){
      return Math.sqrt(a*a + b*b);
    });
    obsP3.$fire();
    obsP1(5);
    obsP2(12);
    obsP3().should.equal(13);
  });

});


describe('#on', function(){

  it('verifies that on is not called without $fire or observer mutation', function(){
    var numFuncCalls = 0;
    var obsChangeHandler = function(){
      numFuncCalls++;
    }
    var obs1 = C.o(0);
    C.on(obs1, obsChangeHandler);
    numFuncCalls.should.equal(0);
  });

  it('verifies that on is called on $fire', function(){
    var numFuncCalls = 0;
    var obsChangeHandler = function(){
      numFuncCalls++;
    }
    var obs1 = C.o(0);
    var foo = C.on(obs1, obsChangeHandler);
    foo.$fire();
    numFuncCalls.should.equal(1);
  });

  it('verifies that on is called on observer mutation', function(){
    var numFuncCalls = 0;
    var obsChangeHandler = function(){
      numFuncCalls++;
    }
    var obs1 = C.o(0);
    var foo = C.on(obs1, obsChangeHandler);
    obs1('bar');
    numFuncCalls.should.equal(1);
  });

});
