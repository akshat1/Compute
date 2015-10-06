###*
# @namespace Compute
###

Compute = 
  version : '%%%COMPUTE_VERSION%%%'

C = Compute


MSGInvalidArgumentsToObservableArray = 'The argument passed when initializing an observable array must be an array, or null, or undefined.'

## Environment detection.

###
Test whether we are running in a browser. If so, we'll define Compute on the
window object. Otherwise, assume we are in Node and we'll export Compute via
module.exports.

Also, try to grab knockout from the window (if present), or
require('knockout') if in node. Silently fall back to using our own
observables if knockout is not installed.

Many thanks to knockoutjs for the environment determination logic
###
if typeof require is 'function' and typeof module?.exports is 'object' and typeof module is 'object'
  module.exports = C
  try
    ko = require 'knockout'
  catch err
    ###
    KO not found. We'll eat the exception and use our own observables
    implementation.
    ###

else if typeof window isnt 'undefined'
  window.Compute = C
  ko = window.ko

else if typeof define is 'function' and define['amd']
  define () -> C

else
  throw new Error 'Compute can not identify this environment. Please let the developers know at https://github.com/akshat1/compute/issues'


# Our custom observables implementation.
# This will be used if, and only if knockout is not found.

###*
# compute's implementation of an Observable
# @param val - the value of the observable
# @return {Observable}
###
Observable = (val) ->
  _value = val

  _subscriptions = []

  callSubscribers = ()->
    for s in _subscriptions
      s _value

  o = (newVal)->
    if arguments.length > 0
      isValueChanged = _value isnt newVal
      _value = newVal

      if isValueChanged
        callSubscribers()

    else
      _value

  o.subscribe = (f)-> _subscriptions.push f
  o._isObservable = true

  o


###*
# compute's implementation of an Observable Array
# @param val - the value of the observable
# @return {Observable}
###
ObservableArray = (arr)->
  _value = arr or []
  unless _value instanceof Array
    throw new Error MSGInvalidArgumentsToObservableArray

  _subscriptions = []

  callSubscribers = ()->
    for s in _subscriptions
      s _value

  o = (newArr)->
    if arguments.length > 0
      _value = newArr
      callSubscribers()

    else
      _value

  o.subscribe = (f)-> _subscriptions.push f

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

###*
# @param {Object} v
# @returns {Boolean} - Whether or not v is an observable
# @memberof Compute
###
C.isObservable = (v)->
  if typeof ko isnt 'undefined'
    ko.isObservable v
  else
    v._isObservable or false


###*
# @param {Observable|ObservableArray} v
# @returns - The value of the observable
###
_unwrap = (v)-> if C.isObservable v then v() else v


###*
# Make sure that all observables (for C.on or C.from) are observables and 
# that the function is a function.
# @param {Array} observables - The array of observables
# @param {function} func - The function to be executed
# @returns {boolean} - Whether or not all observables really are observable 
#                      and func really is a function.
###
_isValid = (observables, func)->
  for o in observables
    return false unless C.isObservable(o)
  return false if C.isObservable(func)
  return false unless typeof func is 'function'
  true


###*
# collect the value of all observables into an Array
# @param {Array} observables - An array of observables
# @returns {Array} - The value of those observables
###
_gather = (observables)->
  values = []
  values.push _unwrap(o) for o in observables
  values


## Expose observables to the outside world.
# This also decides whether to use ko or use Compute's observables.

###*
# Usage:
#   x = Compute.o 'foo'
#   console.log x()      //foo
#   x 'bar'
#   console.log x()      //bar
# @param val - value of the observable
# @returns {Observable}
# @memberof Compute
###
C.o = (val)->
  if typeof ko isnt 'undefined'
    ko.observable val
  else
    Observable val


###*
# Usage:
#   x = Compute.o ['foo', 'bar']
#   console.log x()      //['foo', 'bar']
#   x.push 'bar'
#   console.log x()      //['foo', 'bar', 'baz']
# @param {Array} arr - value of the observable
# @returns {ObservableArray}
# @memberof Compute
###
C.oa = (arr)->
  if typeof ko isnt 'undefined'
    ko.observableArray arr
  else
    ObservableArray arr


###*
# <p>
# Execute function 'f' when any of the observables change. Pass observable values
# as arguments.
# </p><p>
# Usage:
# <pre><code>
# function onWatchedObservableChanged(v1, v2, v3) {
#   console.log("One of the observables changed! We can do something");
#   alert("An observable changed");
# }
# var watch = C.on(obs1, obs2, obs3, onWatchedObservableChanged);
# 
# //Stop watching
# watch.$stop()
# 
# //Resume watching
# watch.$resume()
#
# //Force execution
# watch.$fire()
# 
# </code></pre>
# </p><p>
# @param {...Observable} - the observables to be watched
# @param {function} f - the function used to handle the change. Should expect
#                       the value of each observable as an argument and return
#                       some value to be stored in the resultant observable.
#                       So, for N watched observables, f must expect N 
#                       arguments
# @returns {Object} - An object just containing $stop, $fire and $resume functions
# @memberof Compute
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


###*
# <p>
# Define a new observable, whose value is the value returned by the function 'f'
# when 'f' is called with the values of all observables.
# </p><p>
# This new observable is updated every time one of the observables mutate.
# </p><p>
# Note that for some reason I can't get JSDoc to show the varargs in the documentation
# </p><p>
# Usage:
# <pre><code>
# var newObservable = C.on(obs1, obs2, obs3, function (v1, v2, v3){
#    console.log "One of the observables changed! We can calculate a result using their values";
#    return v1 + v2 + v2;
#    });
#
# //Stop watching
# newObservable.$stop()
# 
# //Resume watching
# newObservable.$resume()
#
# //Force re-eval
# newObservable.$fire()
# </code></pre>
# </p>
# @param {...Observable} - the observables to be watched
# @param {function} f - the function used to calculate the result. Should expect
#                       the value of each observable as an argument. So, for N
#                       watched observables, f must expect N arguments
# @returns {Observable} - The observable obtained by executing f(...ValueOfObservables)
# @memberof Compute
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
C._unwrap         = _unwrap
C.Observable      = Observable
C.ObservableArray = ObservableArray
