
/**
 * @namespace Compute
 */

(function() {
  var C, Compute, MSGInvalidArgumentsToObservableArray, Observable, ObservableArray, _gather, _isValid, _unwrap, err, error, ko,
    slice = [].slice;

  Compute = {
    version: '0.0.7'
  };

  C = Compute;

  MSGInvalidArgumentsToObservableArray = 'The argument passed when initializing an observable array must be an array, or null, or undefined.';


  /*
  Test whether we are running in a browser. If so, we'll define Compute on the
  window object. Otherwise, assume we are in Node and we'll export Compute via
  module.exports.
  
  Also, try to grab knockout from the window (if present), or
  require('knockout') if in node. Silently fall back to using our own
  observables if knockout is not installed.
  
  Many thanks to knockoutjs for the environment determination logic
   */

  if (typeof require === 'function' && typeof (typeof module !== "undefined" && module !== null ? module.exports : void 0) === 'object' && typeof module === 'object') {
    module.exports = C;
    try {
      ko = require('knockout');
    } catch (error) {
      err = error;

      /*
      KO not found. We'll eat the exception and use our own observables
      implementation.
       */
    }
  } else if (typeof window !== 'undefined') {
    window.Compute = C;
    ko = window.ko;
  } else if (typeof define === 'function' && define['amd']) {
    define(function() {
      return C;
    });
  } else {
    throw new Error('Compute can not identify this environment. Please let the developers know at https://github.com/akshat1/compute/issues');
  }


  /**
   * compute's implementation of an Observable
   * @param val - the value of the observable
   * @return {Observable}
   */

  Observable = function(val) {
    var _subscriptions, _value, callSubscribers, o;
    _value = val;
    _subscriptions = [];
    callSubscribers = function() {
      var i, len, results, s;
      results = [];
      for (i = 0, len = _subscriptions.length; i < len; i++) {
        s = _subscriptions[i];
        results.push(s(_value));
      }
      return results;
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
      return _subscriptions.push(f);
    };
    o._isObservable = true;
    return o;
  };


  /**
   * compute's implementation of an Observable Array
   * @param val - the value of the observable
   * @return {Observable}
   */

  ObservableArray = function(arr) {
    var _subscriptions, _value, callSubscribers, o;
    _value = arr || [];
    if (!(_value instanceof Array)) {
      throw new Error(MSGInvalidArgumentsToObservableArray);
    }
    _subscriptions = [];
    callSubscribers = function() {
      var i, len, results, s;
      results = [];
      for (i = 0, len = _subscriptions.length; i < len; i++) {
        s = _subscriptions[i];
        results.push(s(_value));
      }
      return results;
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
      return _subscriptions.push(f);
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


  /**
   * @param {Object} v
   * @returns {Boolean} - Whether or not v is an observable
   * @memberof Compute
   */

  C.isObservable = function(v) {
    if (typeof ko !== 'undefined') {
      return ko.isObservable(v);
    } else {
      return v._isObservable || false;
    }
  };


  /**
   * @param {Observable|ObservableArray} v
   * @returns - The value of the observable
   */

  _unwrap = function(v) {
    if (C.isObservable(v)) {
      return v();
    } else {
      return v;
    }
  };


  /**
   * Make sure that all observables (for C.on or C.from) are observables and 
   * that the function is a function.
   * @param {Array} observables - The array of observables
   * @param {function} func - The function to be executed
   * @returns {boolean} - Whether or not all observables really are observable 
   *                      and func really is a function.
   */

  _isValid = function(observables, func) {
    var i, len, o;
    for (i = 0, len = observables.length; i < len; i++) {
      o = observables[i];
      if (!C.isObservable(o)) {
        return false;
      }
    }
    if (C.isObservable(func)) {
      return false;
    }
    if (typeof func !== 'function') {
      return false;
    }
    return true;
  };


  /**
   * collect the value of all observables into an Array
   * @param {Array} observables - An array of observables
   * @returns {Array} - The value of those observables
   */

  _gather = function(observables) {
    var i, len, o, values;
    values = [];
    for (i = 0, len = observables.length; i < len; i++) {
      o = observables[i];
      values.push(_unwrap(o));
    }
    return values;
  };


  /**
   * Usage:
   *   x = Compute.o 'foo'
   *   console.log x()      //foo
   *   x 'bar'
   *   console.log x()      //bar
   * @param val - value of the observable
   * @returns {Observable}
   * @memberof Compute
   */

  C.o = function(val) {
    if (typeof ko !== 'undefined') {
      return ko.observable(val);
    } else {
      return Observable(val);
    }
  };


  /**
   * Usage:
   *   x = Compute.o ['foo', 'bar']
   *   console.log x()      //['foo', 'bar']
   *   x.push 'bar'
   *   console.log x()      //['foo', 'bar', 'baz']
   * @param {Array} arr - value of the observable
   * @returns {ObservableArray}
   * @memberof Compute
   */

  C.oa = function(arr) {
    if (typeof ko !== 'undefined') {
      return ko.observableArray(arr);
    } else {
      return ObservableArray(arr);
    }
  };


  /**
   * <p>
   * Execute function 'f' when any of the observables change. Pass observable values
   * as arguments.
   * </p><p>
   * Usage:
   * <pre><code>
   * function onWatchedObservableChanged(v1, v2, v3) {
   *   console.log("One of the observables changed! We can do something");
   *   alert("An observable changed");
   * }
   * var watch = C.on(obs1, obs2, obs3, onWatchedObservableChanged);
   * 
   * //Stop watching
   * watch.$stop()
   * 
   * //Resume watching
   * watch.$resume()
   *
   * //Force execution
   * watch.$fire()
   * 
   * </code></pre>
   * </p><p>
   * @param {...Observable} - the observables to be watched
   * @param {function} f - the function used to handle the change. Should expect
   *                       the value of each observable as an argument and return
   *                       some value to be stored in the resultant observable.
   *                       So, for N watched observables, f must expect N 
   *                       arguments
   * @returns {Object} - An object just containing $stop, $fire and $resume functions
   * @memberof Compute
   */

  C.on = function() {
    var f, func, i, isStopped, j, len, o, observables;
    observables = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), f = arguments[i++];
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
    for (j = 0, len = observables.length; j < len; j++) {
      o = observables[j];
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


  /**
   * <p>
   * Define a new observable, whose value is the value returned by the function 'f'
   * when 'f' is called with the values of all observables.
   * </p><p>
   * This new observable is updated every time one of the observables mutate.
   * </p><p>
   * Note that for some reason I can't get JSDoc to show the varargs in the documentation
   * </p><p>
   * Usage:
   * <pre><code>
   * var newObservable = C.on(obs1, obs2, obs3, function (v1, v2, v3){
   *    console.log "One of the observables changed! We can calculate a result using their values";
   *    return v1 + v2 + v2;
   *    });
   *
   * //Stop watching
   * newObservable.$stop()
   * 
   * //Resume watching
   * newObservable.$resume()
   *
   * //Force re-eval
   * newObservable.$fire()
   * </code></pre>
   * </p>
   * @param {...Observable} - the observables to be watched
   * @param {function} f - the function used to calculate the result. Should expect
   *                       the value of each observable as an argument. So, for N
   *                       watched observables, f must expect N arguments
   * @returns {Observable} - The observable obtained by executing f(...ValueOfObservables)
   * @memberof Compute
   */

  C.from = function() {
    var f, func, i, isStopped, j, len, newOb, o, observables;
    observables = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), f = arguments[i++];
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
    for (j = 0, len = observables.length; j < len; j++) {
      o = observables[j];
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

  C._unwrap = _unwrap;

  C.Observable = Observable;

  C.ObservableArray = ObservableArray;

}).call(this);
