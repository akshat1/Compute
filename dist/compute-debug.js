(function() {
  var C, InvalidObservableArrayArgumentsError, Observable, ObservableArray, _gather, _isObservable, _isValid, _unwrap,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  C = {};

  InvalidObservableArrayArgumentsError = (function(_super) {
    __extends(InvalidObservableArrayArgumentsError, _super);

    function InvalidObservableArrayArgumentsError() {
      InvalidObservableArrayArgumentsError.__super__.constructor.call(this, 'Argument to observable array must be null, undefined or Array');
    }

    return InvalidObservableArrayArgumentsError;

  })(Error);

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
      throw new InvalidObservableArrayArgumentsError();
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
    o.peek = function() {
      return _value[_value.length - 1];
    };
    o._isObservable = true;
    return o;
  };

  _isObservable = function(v) {
    if (typeof ko !== 'undefined') {
      return ko.isObservable(v);
    } else {
      return v._isObservable;
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
    var o;
    if (!(function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = observables.length; _i < _len; _i++) {
        o = observables[_i];
        _results.push(_isObservable(o));
      }
      return _results;
    })()) {
      return false;
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

  C.o = function(val) {
    if (typeof ko !== 'undefined') {
      return ko.observable(val);
    } else {
      return Observable(val);
    }
  };

  C.oa = function(arr) {
    if (typeof ko !== 'undefined') {
      return ko.observableArray(arr);
    } else {
      return ObservableArray(arr);
    }
  };

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

  C.from = function() {
    var f, func, isStopped, newOb, o, observables, _i, _j, _len;
    observables = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), f = arguments[_i++];
    if (!_isValid(observables, f)) {
      throw new Error('Invalid arguments to C.on');
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

  C.Observable = Observable;

  C.ObservableArray = ObservableArray;

  C.InvalidObservableArrayArgumentsError = InvalidObservableArrayArgumentsError;

  if (typeof window !== 'undefined') {
    window.Compute = C;
  } else if (module) {
    module.exports = C;
  }

}).call(this);
