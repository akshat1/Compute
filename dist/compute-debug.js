'use strict';

// UMD pattern copied from https://addyosmani.com/writing-modular-js/
(function(define) {
  define('Compute', function(require, exports) {
    /**
     * An extremely simple reactive programming library
     * @exports Compute
     */
    var Compute;
    var C = Compute = exports;
    C.version = '0.0.9';
    var MSGInvalidArgumentsToObservableArray = 'The argument passed when initializing an observable array must be an array, or null, or undefined.';
    var MSGInvalidArgumentToSubscribe        = 'fn must be a function';
    var MSGInvalidArgumentToOnChange         = 'Invalid arguments to OnChange';
    var MSGInvalidArgumentToFrom             = 'Invalid arguments to From';
    var ko;

    /*
     * Determine whether or not the object is an Array. Uses Array.isArray if available, failing
     * which uses Object.toString.
     * @see http://web.mit.edu/jwalden/www/isArray.html
     * @param {Object} obj - The object to be tested
     * @returns {boolean} - whether or not the object is an Array
     */
    var isArray = (typeof Array.isArray === 'function') ? Array.isArray.bind(Array) : function isArray(obj) {
      return (obj instanceof Array || (Object.prototype.toString.call(obj) === '[object Array]'))
    }


    /* ****************************************************************************
     * Implement observables unless knockout is present; In which case we create
     * proxies around knockout's observables (for use within our module).
     * ****************************************************************************/
    C._knockoutFound = function _knockoutFound(ko) {
      C.Observable      = ko.observable;
      C.ObservableArray = ko.observableArray;
      C.isObservable    = ko.isObservable;
      C.unwrap          = ko.unwrap;
    }


    // No knockout. Use our own observables.
    C._noKnockoutFound = function _noKnockoutFound() {
      /**
       * @alias isObservable
       * @memberof module:Compute
       * @param {object} obj - the object to be tested
       * @returns {boolean} - whether or not obj is an observable
       */
      C.isObservable = function computeIsObservable(obj) {
        return obj._isObservable || false;
      }

      /**
       * get the value of observable obj
       * <p>Note that since each observable is a function, you can also simply execute the observable without values to get its value</p>
       * @alias unwrap
       * @memberof module:Compute
       * @param {object} obj - the observable whose value is required
       * @returns {object} - the value stored within the observable obj
       */
      C.unwrap = function computeUnwrap(obj) {
        return obj.state.value;
      }

      /**
       * Create a subscription on an observable (with state 'state') such that fn is
       * executed every time the observable changes.
       * @name _computeSubscribe
       * @access private
       * @memberof module:Compute
       * @param {Object} state - Internal state representation of an observable
       * @param {Function} fn - The function to be executed when the observable changes
       */
      C._computeSubscribe = function _computeSubscribe(state, fn) {
        if (typeof fn !== 'function')
          throw new Error(MSGInvalidArgumentToSubscribe);
        state.subscriptions.push(fn);
      }

      /**
       * Call all the subscribers of the observable with this state with the
       * curent value of the observable.
       * @name _computeCallSubscribers
       * @param {Object} state
       * @memberof module:Compute
       * @access private
       */
      C._computeCallSubscribers = function _computeCallSubscribers(state) {
        var subscriptions = state.subscriptions;
        var value = state.value;
        for (var i = 0, len = subscriptions.length; i < len; i++) {
          subscriptions[i](value);
        }
      }

      /**
       * the behavior of an observable when it is called. If provided a newValue,
       * it will be set as the value of this observable and (if the newValue is
       * different) all the subscribers called with the latest value. Otherwise, simply
       * the current value will be returned.
       * @name _computeObservableCall
       * @memberof module:Compute
       * @access private
       * @param {Object} state - the internal state of an observable
       * @param {Object} [newValue] - the new new value of this observable
       */
      C._computeObservableCall = function _computeObservableCall(state, newValue) {
        if(typeof newValue === 'undefined')
          return state.value;

        if (state.isArray && !isArray(newValue))
          throw new Error(MSGInvalidArgumentsToObservableArray);

        var valueChanged = newValue !== state.value;
        state.value = newValue;
        if (valueChanged)
          C._computeCallSubscribers(state);
      }

      /**
       * create an observable
       * @returns {Observable}
       * @memberof module:Compute
       * @access private
       */
      C._computeObservable = function _computeObservable(value, thisIsAnArray) {
        if (thisIsAnArray && value !== null && (typeof value !== 'undefined') && !isArray(value))
          throw new Error(MSGInvalidArgumentsToObservableArray);

        /**
         * The internal state of the observable being created.
         * @name state
         * @property
         * @memberof Observable.prototype
         */
        var state = {
          value         : thisIsAnArray ? (value || []) : value,
          subscriptions : [],
          isArray       : thisIsAnArray
        };

        var result = function (newValue) {
          return C._computeObservableCall(state, newValue);
        }

        result.state = state;

        /**
         * execute fn every time the value of this observable changes
         * @access public
         * @name subscribe
         * @memberof Observable.prototype
         * @param {Function} fn
         */
        result.subscribe = function (fn) {
          C._computeSubscribe(state, fn);
        }

        result._isObservable = true;
        if (thisIsAnArray) {
          /**
           * @memberof ObservableArray.prototype
           * @param {...Object} items - the items to be added to this observable array
           * @name push
           */
          result.push = function computeObservableArrayPush() {
            var newItems = Array.prototype.slice.apply(arguments);
            for (var i = 0, len = newItems.length; i < len; i++) {
              state.value.push(newItems[i]);
            }
            C._computeCallSubscribers(state);
            return state.value.length;
          };

          /**
           * @memberof ObservableArray.prototype
           * @returns {Object} - the last item in this observable array
           * @name pop
           */
          result.pop = function computeObservableArrayPop() {
            var value = state.value;
            if (value.length === 0)
              return;

            var item = state.value.pop();
            if (item)
              C._computeCallSubscribers(state);
            return item;
          }
        }

        return result;
      };

      /**
       * <p><b>NOTE: This is actually a factory function; I just don't know how to document factories with JSDoc</b></p>
       * A function which can be called to store / retreive a value and which can be observed in order to
       * react to updated values.
       * @constructor
       * @name Observable
       * @augments Observable
       * @memberof module:Compute
       */
      C.Observable = C._computeObservable;

      /**
       * <p><b>NOTE: This is actually a factory function; I just don't know how to document factories with JSDoc</b></p>
       * Same as observable but intended to deal with arrays. Comes with extra sugar methods for arrays.
       * @constructor
       * @name ObservableArray
       * @augments Observable
       * @augments ObservableArray
       * @memberof module:Compute
       */
      C.ObservableArray = function computeObservableProxyForArray(value) {
        return C._computeObservable(value, true);
      }
    }


    try {
      // We have knockout. Use KO's observables and utilities
      // in node, require('knockout') works while in browser, require('ko')
      ko = require('knockout') || require('ko');
      if (ko)
        C._knockoutFound(ko);
      else
        C._noKnockoutFound(ko);

    } catch (err) {
      C._noKnockoutFound();
    }


    /* ****************************************************************************
     * Implement Compute.on and Compute.from
     * ****************************************************************************/


    /**
     * Ensure that all observables areally are observables and that func is a function.
     * @param {Array} observables
     * @param {function} func
     * @returns {boolean}
     * @memberof module:Compute
     * @access private
     */
    C._isValid = function _isValid(observables, func) {
      if (C.isObservable(func))
        return false;

      if (typeof func !== 'function')
        return false;

      for (var i = 0, len = observables.length; i < len; i++) {
        if (!C.isObservable(observables[i]))
          return false;
      }

      return true;
    }

    /**
     * given an array of observables, return their values as an array
     * @param {Array} observables - The observables to be evaluated
     * @returns {Array} - Values of observables in observables array
     * @memberof module:Compute
     * @access private
     */
    C._gather = function _gather(observables) {
      var values = [];
      for (var i = 0, len = observables.length; i < len; i++) {
        values.push(C.unwrap(observables[i]));
      }
      return values;
    }

    /**
     * call a function whenever the value of specified observables is changed
     * @alias on
     * @param {...Observable} observables - The observables to be monitored
     * @param {function} handler - The function to be called with the value of all observables
     * @memberof module:Compute
     */
    function computeOnChange() {
      var observables = Array.prototype.slice.apply(arguments);
      var handler = observables.pop();
      if (C._isValid(observables, handler)) {
        var stopped = false;
        var internalOnChangeHandler = function internalOnChangeHandler() {
          if (!stopped)
            handler.apply(null, C._gather(observables));
        }

        for (var i = 0, len = observables.length; i < len; i++)
          observables[i].subscribe(internalOnChangeHandler);

        return {
          $fire: internalOnChangeHandler,
          $stop: function() {
            stopped = true;
          },
          $resume: function() {
            stopped = false;
          }
        };
      } else {
        throw new Error(MSGInvalidArgumentToOnChange);
      }
    }

    /**
     * Given a set of observables, and a compute function, return a new observable
     * which gets its value from the function handler and the value of each source
     * observable. Update the value of this observable every time one of the
     * observables changes.
     * @alias from
     * @param {...Observable} observables - The observables to be monitored
     * @param {function} handler - The function to be called with values of all source observables to get the new value of this observable
     * @memberof module:Compute
     */
    function computeFrom() {
      var observables = Array.prototype.slice.apply(arguments);
      var handler = observables.pop();
      if (C._isValid(observables, handler)) {
        var newObservable = C.Observable();
        function internalOnChangeHandlerForFrom() {
          newObservable(handler.apply(null, arguments));
          return newObservable;
        }

        var thunk = Compute.on.apply(this, observables.concat([internalOnChangeHandlerForFrom]));
        newObservable._internalChangeHandler = internalOnChangeHandlerForFrom;
        newObservable.$fire = thunk.$fire;
        newObservable.$stop = thunk.$stop;
        newObservable.$resume = thunk.$resume;
        return newObservable;
      } else {
        throw new Error(MSGInvalidArgumentToFrom);
      }
    }

    /* ****************************************************************************
     * API
     * Export as much as possible to facilitate testing.
     * ****************************************************************************/
     // deprecated exports
     C._unwrap = C.unwrap;

     // current
     exports['o']    = C.Observable;
     exports['oa']   = C.ObservableArray;
     exports['on']   = computeOnChange;
     exports['from'] = computeFrom;

     // Error messages for consuming in tests
     exports[MSGInvalidArgumentToFrom]             = MSGInvalidArgumentToFrom
     exports[MSGInvalidArgumentToSubscribe]        = MSGInvalidArgumentToSubscribe
     exports[MSGInvalidArgumentToOnChange]         = MSGInvalidArgumentToOnChange
     exports[MSGInvalidArgumentsToObservableArray] = MSGInvalidArgumentsToObservableArray
    // END DEFINITION
  });
  // UMD wrapper taken from https://addyosmani.com/writing-modular-js/
}(typeof define === 'function' && define.amd ? define : function (id, factory) {
  // Not in AMD. create a fake define
  if (typeof exports!== 'undefined') {
    // CommonJS
    factory(require, exports);
  } else {
    // Bare browser? Create a global function
    factory(function(value) {
      return window[value];
    }, (window[id] = {}));
  }
}));