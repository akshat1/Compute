should = require('chai').should()
C      = require '../src/Compute.coffee'

#TODO: _isObservable, _unwrap, _isValid, _gather
#TODO: $stop, $resume

# Test Observables
describe '#observable', () ->
  firstValue = 'test value 0'
  secondValue = 'test value 1'
  it 'gets the original value of the observable', () ->
    obs1 = C.o firstValue
    obs1().should.equal firstValue
    return

  it 'gets the value we just set', () ->
    obs2 = C.o firstValue
    obs2 secondValue
    obs2().should.equal secondValue
    return

  return

describe '#observable array', () ->
  it 'tests that observable array creation for non-valid input', () ->
    caughtError = null
    try
      oA = C.oa 'blah'
    catch err
      caughtError = err
    (caughtError instanceof C.InvalidObservableArrayArgumentsError).should.equal true
    return

  it 'tests that observable array succeeds for null input', () ->
    oA = C.oa()
    arr = oA()
    (arr instanceof Array).should.equal true
    arr.length.should.equal 0
    return

  it 'tests that observable array succees for array input', () ->
    srcArray = [
      1
      2
      3
    ]
    oA = C.oa srcArray
    arr = oA()
    arr.should.equal srcArray
    return

  it 'tests that array observable honors subscribe on setting value', () ->
    oa1 = C.oa()
    tmp = null
    oa1.subscribe (v) ->
      tmp = v
      return

    testArr1 = [
      1
      2
      3
    ]
    oa1 testArr1
    tmp.should.equal testArr1
    oa1().should.equal testArr1
    testArr2 = [
      4
      5
      6
    ]
    oa1 testArr2
    tmp.should.equal testArr2
    return

  it 'tests that array observable honors subscribe on push/pop', () ->
    testArr = [
      1
      2
      3
    ]
    oa1 = C.oa testArr
    tmp = null
    oa1.subscribe (v) ->
      tmp = v.join 'x'
      return

    oa1.push 4
    tmp.should.equal '1x2x3x4'
    oa1.pop()
    tmp.should.equal '1x2x3'
    return

  it 'tests array observable peek', () ->
    testArr = [
      1
      2
      3
    ]
    oa1 = C.oa testArr
    tmp = -1
    oa1.subscribe (v) ->
      tmp = v.join 'x'
      return

    peekedValue = oa1.peek()
    tmp.should.equal -1
    peekedValue.should.equal 3
    return

  return

describe '#from', () ->
  it 'verifies that $from works with preset source observables using $fire', () ->
    obsP1 = C.o 3
    obsP2 = C.o 4
    obsP3 = C.from obsP1, obsP2, (a, b) ->
      Math.sqrt a * a + b * b

    obsP3.$fire()
    obsP3().should.equal 5
    return

  it 'verifies that $from changes with source observables being changed', () ->
    obsP1 = C.o 3
    obsP2 = C.o 4
    obsP3 = C.from obsP1, obsP2, (a, b) ->
      Math.sqrt a * a + b * b

    obsP3.$fire()
    obsP1 5
    obsP2 12
    obsP3().should.equal 13
    return

  return

describe '#on', () ->
  it 'verifies that on is not called without $fire or observer mutation', () ->
    numFuncCalls = 0
    obsChangeHandler = () ->
      numFuncCalls++
      return

    obs1 = C.o 0
    C.on obs1, obsChangeHandler
    numFuncCalls.should.equal 0
    return

  it 'verifies that on is called on $fire', () ->
    numFuncCalls = 0
    obsChangeHandler = () ->
      numFuncCalls++
      return

    obs1 = C.o 0
    foo = C.on obs1, obsChangeHandler
    foo.$fire()
    numFuncCalls.should.equal 1
    return

  it 'verifies that on is called on observer mutation', () ->
    numFuncCalls = 0
    obsChangeHandler = () ->
      numFuncCalls++
      return

    obs1 = C.o 0
    foo = C.on obs1, obsChangeHandler
    obs1 'bar'
    numFuncCalls.should.equal 1
    return

  return
