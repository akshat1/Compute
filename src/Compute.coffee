C = {}

MSGInvalidArgumentsToObservableArray = 'The argument passed when initializing an observable array must be an array, or null, or undefined.'

# If we are in node (which we will be, eventually)
if typeof window isnt 'undefined'
  window.Compute = C
else if module
  # We are running in node
  # Try to load knockout.
  try
    ko = require 'knockout'
  catch err
    # Eat the exception. We have our own observables implementation.

  module.exports = C


# One shouldn't have to use knockout, awesome as it is, just for observables.
# The following will be used (only) when knockout is not present.

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
    console.log "\n\n\n SNAP : 0 \n#{MSGInvalidArgumentsToObservableArray}\n\n"
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

C.o = (val)->
  if typeof ko isnt 'undefined'
    ko.observable val
  else
    Observable val

C.oa = (arr)->
  if typeof ko isnt 'undefined'
    ko.observableArray arr
  else
    ObservableArray arr


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

C._gather         = _gather
C._isValid        = _isValid
C._isObservable   = _isObservable
C._unwrap         = _unwrap
C.Observable      = Observable
C.ObservableArray = ObservableArray
