# If we are in a browser, then define Compute on the window.
C = {}

isValid = (observables, func)->
  return false unless ko.isObservable o for o in observables
  return false if ko.isObservable func
  return false unless typeof func is 'function'
  true

gather = (observables)->
  values = []
  values.push ko.unwrap(o) for o in observables
  values

C.o = (val)->
  o = ko.observable val
  o

C.oa = (arr)->
  ko.observableArray arr

C.on = (observables..., f)->
  throw new Error 'Invalid arguments to C.on' unless isValid observables, f
  isStopped = false
  func = ()->
    return if isStopped
    f.apply null, gather(observables)

  o.subscribe func for o in observables

  $fire: func
  $stop: ()-> isStopped = true
  $resume: ()-> isStopped = false


C.from = (observables..., f)->
  throw new Error 'Invalid arguments to C.on' unless isValid observables, f
  newOb = ko.observable()
  isStopped = false
  func = ()->
    return if isStopped
    val = f.apply null, gather(observables)
    newOb val
    newOb

  o.subscribe func for o in observables
  newOb.$fire = func
  newOb.$stop = ()-> isStopped = true
  newOb.$resume = ()-> isStopped = false
  newOb

# If we are in node (which we will be, eventually)
if window
  window.Compute = C
else if module
  module.exports = Compute
