(function() {
  var C, MSGInvalidArgumentsToObservableArray, Observable, ObservableArray, err, ko, _gather, _isObservable, _isValid, _unwrap,
    __slice = [].slice;

  C = {};

  MSGInvalidArgumentsToObservableArray = 'The argument passed when initializing an observable array must be an array, or null, or undefined.';


  /*
  Test whether we are running in a browser. If so, we'll define Compute on the
  window object. Otherwise, assume we are in Node and we'll export Compute via
  module.exports. Also, try to load knockout and silently fall back to using
  our own observables if knockout is not installed.
   */

  if (typeof window !== 'undefined') {
    window.Compute = C;
  } else if (module) {
    module.exports = C;
    try {
      ko = require('knockout');
    } catch (_error) {
      err = _error;

      /*
      KO not found. We'll eat the exception and use our own observables
      implementation.
       */
    }
  }

  Observable = function(val) {
    var callSubscribers, o, subscriptions, _value;
    _value = val;
    subscriptions = [];
    callSubscribers = function() {
      var s, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = subscriptions.length; _i < _len; _i++) {
        s = subscriptions[_i];
        _results.push(s(_value));
      }
      return _results;
    };
    o = function(newVal) {
      var isValueChanged;
      if (arguments.length > 0) {
        isValueChanged = _value !== newVal;
        _value = newVal;
        if (isValueChanged) {
          return callSubscribers();
        }
      } else {
        return _value;
      }
    };
    o.subscribe = function(f) {
      return subscriptions.push(f);
    };
    o._isObservable = true;
    return o;
  };

  ObservableArray = function(arr) {
    var callSubscribers, o, subscriptions, _value;
    _value = arr || [];
    if (!(_value instanceof Array)) {
      throw new Error(MSGInvalidArgumentsToObservableArray);
    }
    subscriptions = [];
    callSubscribers = function() {
      var s, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = subscriptions.length; _i < _len; _i++) {
        s = subscriptions[_i];
        _results.push(s(_value));
      }
      return _results;
    };
    o = function(newArr) {
      if (arguments.length > 0) {
        _value = newArr;
        return callSubscribers();
      } else {
        return _value;
      }
    };
    o.subscribe = function(f) {
      return subscriptions.push(f);
    };
    o.push = function(v) {
      _value.push(v);
      return callSubscribers();
    };
    o.pop = function() {
      var v;
      v = _value.pop();
      callSubscribers();
      return v;
    };
    o._isObservable = true;
    return o;
  };

  _isObservable = function(v) {
    if (typeof ko !== 'undefined') {
      return ko.isObservable(v);
    } else {
      return v._isObservable || false;
    }
  };

  _unwrap = function(v) {
    if (_isObservable(v)) {
      return v();
    } else {
      return v;
    }
  };

  _isValid = function(observables, func) {
    var o, _i, _len;
    for (_i = 0, _len = observables.length; _i < _len; _i++) {
      o = observables[_i];
      if (!_isObservable(o)) {
        return false;
      }
    }
    if (_isObservable(func)) {
      return false;
    }
    if (typeof func !== 'function') {
      return false;
    }
    return true;
  };

  _gather = function(observables) {
    var o, values, _i, _len;
    values = [];
    for (_i = 0, _len = observables.length; _i < _len; _i++) {
      o = observables[_i];
      values.push(_unwrap(o));
    }
    return values;
  };


  /*
  Usage:
    x = Compute.o 'foo'
    console.log x()      //foo
    x 'bar'
    console.log x()      //bar
   */

  C.o = function(val) {
    if (typeof ko !== 'undefined') {
      return ko.observable(val);
    } else {
      return Observable(val);
    }
  };


  /*
  Usage:
    x = Compute.o ['foo', 'bar']
    console.log x()      //['foo', 'bar']
    x.push 'bar'
    console.log x()      //['foo', 'bar', 'baz']
   */

  C.oa = function(arr) {
    if (typeof ko !== 'undefined') {
      return ko.observableArray(arr);
    } else {
      return ObservableArray(arr);
    }
  };


  /*
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
   */

  C.on = function() {
    var f, func, isStopped, o, observables, _i, _j, _len;
    observables = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), f = arguments[_i++];
    if (!_isValid(observables, f)) {
      throw new Error('Invalid arguments to C.on');
    }
    isStopped = false;
    func = function() {
      if (isStopped) {
        return;
      }
      return f.apply(null, _gather(observables));
    };
    for (_j = 0, _len = observables.length; _j < _len; _j++) {
      o = observables[_j];
      o.subscribe(func);
    }
    return {
      $fire: func,
      $stop: function() {
        return isStopped = true;
      },
      $resume: function() {
        return isStopped = false;
      }
    };
  };


  /*
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
   */

  C.from = function() {
    var f, func, isStopped, newOb, o, observables, _i, _j, _len;
    observables = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), f = arguments[_i++];
    if (!_isValid(observables, f)) {
      throw new Error('Invalid arguments to C.from');
    }
    newOb = C.o();
    isStopped = false;
    func = function() {
      var val;
      if (isStopped) {
        return;
      }
      val = f.apply(null, _gather(observables));
      newOb(val);
      return newOb;
    };
    for (_j = 0, _len = observables.length; _j < _len; _j++) {
      o = observables[_j];
      o.subscribe(func);
    }
    newOb.$fire = func;
    newOb.$stop = function() {
      return isStopped = true;
    };
    newOb.$resume = function() {
      return isStopped = false;
    };
    return newOb;
  };

  C._gather = _gather;

  C._isValid = _isValid;

  C._isObservable = _isObservable;

  C._unwrap = _unwrap;

  C.Observable = Observable;

  C.ObservableArray = ObservableArray;

}).call(this);
