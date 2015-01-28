chai   = require 'chai'
C      = require '../src/Compute.coffee'
should = chai.should()
expect = chai.expect

#TODO: ko paths
#TODO: _isValid, _gather
#TODO: $stop, $resume

describe '#_isObservable', ()->
  it 'tests that isObservable should be true for an observable', ()->
    obs = C.o 'foo'
    C._isObservable(obs).should.equal true
    return

  it 'tests that isObservable should be false for a non-observable', ()->
    nonObs = 'bar'
    C._isObservable(nonObs).should.equal false

    nonObs = 3
    C._isObservable(nonObs).should.equal false
    return

  return


describe '#_unwrap', ()->
  it 'tests that unwrap correctly unwraps an observable', ()->
    obs = C.o 4
    C._unwrap(obs).should.equal 4
    return

  it 'tests that unwrap simply returns a non-observable as is', ()->
    t = 'foo'
    C._unwrap(t).should.equal t
    return

  return


describe '#_isValid', ()->
  it 'tests that isValid returns true if all items in first arr are observables', ()->
    observables = [C.o(), C.o(), C.o()]
    func = ()->
    C._isValid(observables, func).should.equal true
    return

  it 'tests that isValid returns false if one of the items in first arr is not observable', ()->
    observables = [C.o(), 3, C.o()]
    func = ()->
    C._isValid(observables, func).should.equal false
    return

  it 'tests that isValid returns false if func is an observable', ()->
    observables = [C.o(), C.o(), C.o()]
    func = C.o()
    C._isValid(observables, func).should.equal false
    return

  it 'tests that isValid returns false if func is not a function', ()->
    observables = [C.o(), C.o(), C.o()]
    func = 4
    C._isValid(observables, func).should.equal false
    return

  return


  describe '#_gather', ()->
    it 'tests that gather correctly returns the value of a bunch of observables', ()->
      observables = [C.o('foo'), C.o('bar'), C.o('baz')]
      values = C._gather(observables)
      expect(values).to.eql ['foo', 'bar', 'baz']


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

  it 'tests that subscriptions are not fired unless value actually changes', ()->
    obs1 = C.o firstValue
    timesCalled = 0
    C.on obs1, ()-> timesCalled += 1
    obs1 firstValue
    obs1 firstValue
    obs1 firstValue
    timesCalled.should.equal 0
    return

  return


describe '#observable array', () ->
  it 'tests that observable array creation fails for non-valid input', () ->
    caughtError = null
    try
      oA = C.oa 'blah'
    catch err
      caughtError = err
    caughtError.message.should.equal 'The argument passed when initializing an observable array must be an array, or null, or undefined.'
    return

  it 'tests that observable array succeeds for null input', () ->
    oA = C.oa()
    arr = oA()
    (arr instanceof Array).should.equal true
    arr.length.should.equal 0
    return

  it 'tests that observable array succees for array input', () ->
    srcArray = [1, 2, 3]
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

    testArr1 = [1, 2, 3]
    oa1 testArr1
    tmp.should.equal testArr1
    oa1().should.equal testArr1
    testArr2 = [4, 5, 6]
    oa1 testArr2
    tmp.should.equal testArr2
    return

  it 'tests that array observable honors subscribe on push/pop', () ->
    testArr = [1, 2, 3]
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

  return


describe '#from', () ->
  it 'verifies that C.from fails for invalid arguments', ()->
    try
      C.from C.oa(['a']), 1, ()->
    catch caughtError
    caughtError.message.should.equal 'Invalid arguments to C.from'

  it 'verifies that C.from works with preset source observables using $fire', () ->
    obsP1 = C.o 3
    obsP2 = C.o 4
    obsP3 = C.from obsP1, obsP2, (a, b) ->
      Math.sqrt a * a + b * b

    obsP3.$fire()
    obsP3().should.equal 5
    return

  it 'verifies that C.from changes with source observables being changed', () ->
    obsP1 = C.o 3
    obsP2 = C.o 4
    obsP3 = C.from obsP1, obsP2, (a, b) ->
      Math.sqrt a * a + b * b

    obsP3.$fire()
    obsP1 5
    obsP2 12
    obsP3().should.equal 13
    return

  it 'verifies that C.from stops after $stop', ()->
    obs = C.o()
    isCalled = false
    t = C.from obs, ()-> isCalled = true
    t.$stop()
    obs 1
    isCalled.should.equal false

  it 'verifies that a stopped C.from can be resumed with $resume', ()->
    obs = C.o()
    isCalled = false
    t = C.from obs, ()-> isCalled = true
    t.$stop()
    t.$resume()
    obs 1
    isCalled.should.equal true

  return


describe '#on', () ->
  it 'verifies that on fails for invalid observables', ()->
    try
      C.on C.o('a'), 1, ()->
    catch caughtError
    caughtError.message.should.equal 'Invalid arguments to C.on'

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

  it 'verifies that C.on stops reacting after $stop', ()->
    obs = C.o()
    isCalled = false
    t = C.on obs, ()-> isCalled = true
    t.$stop()
    obs 1
    isCalled.should.equal false

  it 'verifies that a stopped C.on resumes after calling $resume', ()->
    obs = C.o()
    isCalled = false
    t = C.on obs, ()-> isCalled = true
    t.$stop()
    t.$resume()
    obs 1
    isCalled.should.equal true

  return
