C =
  version : '%%%COMPUTE_VERSION%%%'


MSGInvalidArgumentsToObservableArray = 'The argument passed when initializing an observable array must be an array, or null, or undefined.'

## Environment detection.

###
Test whether we are running in a browser. If so, we'll define Compute on the
window object. Otherwise, assume we are in Node and we'll export Compute via
module.exports. Also, try to load knockout and silently fall back to using
our own observables if knockout is not installed.
###
if typeof window isnt 'undefined'
  window.Compute = C
  ko = window.ko
else if module
  module.exports = C

  try
    ko = require 'knockout'
  catch err
    ###
    KO not found. We'll eat the exception and use our own observables
    implementation.
    ###


## Our custom observables implementation.
# This will be used if, and only if knockout is not found.

Observable = (val) ->
  _value = val

  subscriptions = []

  callSubscribers = ()->
    for s in subscriptions
      s _value

  o = (newVal)->
    if arguments.length > 0
      isValueChanged = _value isnt newVal
      _value = newVal

      if isValueChanged
        callSubscribers()

    else
      _value

  o.subscribe = (f)-> subscriptions.push f
  o._isObservable = true

  o


ObservableArray = (arr)->
  _value = arr or []
  unless _value instanceof Array
    throw new Error MSGInvalidArgumentsToObservableArray

  subscriptions = []

  callSubscribers = ()->
    for s in subscriptions
      s _value

  o = (newArr)->
    if arguments.length > 0
      _value = newArr
      callSubscribers()

    else
      _value

  o.subscribe = (f)-> subscriptions.push f

  o.push = (v)->
    _value.push v
    callSubscribers()

  o.pop = ()->
    v = _value.pop()
    callSubscribers()
    v

  o._isObservable = true

  o


## Internal utility functions

_isObservable = (v)->
  if typeof ko isnt 'undefined'
    ko.isObservable v
  else
    v._isObservable or false


_unwrap = (v)-> if _isObservable v then v() else v


_isValid = (observables, func)->
  for o in observables
    return false unless _isObservable(o)
  return false if _isObservable(func)
  return false unless typeof func is 'function'
  true

_gather = (observables)->
  values = []
  values.push _unwrap(o) for o in observables
  values


## Expose observables to the outside world.
# This also decides whether to use ko or use Compute's observables.

###
Usage:
  x = Compute.o 'foo'
  console.log x()      //foo
  x 'bar'
  console.log x()      //bar
###
C.o = (val)->
  if typeof ko isnt 'undefined'
    ko.observable val
  else
    Observable val


###
Usage:
  x = Compute.o ['foo', 'bar']
  console.log x()      //['foo', 'bar']
  x.push 'bar'
  console.log x()      //['foo', 'bar', 'baz']
###
C.oa = (arr)->
  if typeof ko isnt 'undefined'
    ko.observableArray arr
  else
    ObservableArray arr


###
Execute function 'f' when any of the observables change. Pass observable values
as arguments.

Usage:
  C.on obs1, obs2, obs3, (o1, o2, o3)->
    console.log "One of the observables changed!"

grab the on like so
  t = C.on .....

Call t.$stop() to ignore subsequent observable mutations. Call t.$resume() to
resume. Call $fire() to force executing f with current values of all
observables.
###
C.on = (observables..., f)->
  unless _isValid observables, f
    throw new Error 'Invalid arguments to C.on'
  isStopped = false
  func = ()->
    return if isStopped
    f.apply null, _gather(observables)

  o.subscribe func for o in observables

  $fire   : func
  $stop   : ()-> isStopped = true
  $resume : ()-> isStopped = false


###
Define a new observable, whose value is the value returned by the function 'f'
when 'f' called with the values of all observables.

This new observable is updated every time one of the observables mutate.

Usage:
  C.on obs1, obs2, obs3, (o1, o2, o3)->
    console.log "One of the observables changed!"

grab the on like so
  t = C.on .....

Call t.$stop() to ignore subsequent observable mutations. Call t.$resume() to
resume. Call $fire() to force executing f with current values of all
observables.
###
C.from = (observables..., f)->
  unless _isValid observables, f
    throw new Error 'Invalid arguments to C.from'
  newOb = C.o()
  isStopped = false
  func = ()->
    return if isStopped
    val = f.apply null, _gather(observables)
    newOb val
    newOb

  o.subscribe func for o in observables
  newOb.$fire = func
  newOb.$stop = ()-> isStopped = true
  newOb.$resume = ()-> isStopped = false
  newOb

## Export everything on Compute
# (Export internal util functions too, for testing).
C._gather         = _gather
C._isValid        = _isValid
C._isObservable   = _isObservable
C._unwrap         = _unwrap
C.Observable      = Observable
C.ObservableArray = ObservableArray
