/**
* @namespace Compute
*/

'use strict';

// UMD pattern copied from https://addyosmani.com/writing-modular-js/
(function(define) {
  define('Compute', function(require, exports) {
    // BEGIN DEFINITION
    var Compute;
    var MSGInvalidArgumentsToObservableArray = 'The argument passed when initializing an observable array must be an array, or null, or undefined.';
    var MSGInvalidArgumentToSubscribe        = 'fn must be a function';
    var MSGInvalidArgumentToOnChange         = 'Invalid arguments to OnChange';
    var MSGInvalidArgumentToFrom             = 'Invalid arguments to From';
    var ko,
        observable,
        observableArray,
        computeSubscribe,
        computeCallSubscribers,
        computeObservableCall,
        computeObservable,
        isObservable,
        unwrap,
        isValid,
        gather,
        on,
        from;

    /**
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
    function knockoutFound(ko) {
      observable = function observableProxy(value) {
        return ko.observable(value);
      }

      observableArray = function observableArrayProxy(value) {
        return ko.observableArray(value);
      };

      isObservable = function isObservableProxy(obj) {
        return ko.isObservable(obj);
      }

      unwrap = function unwrapProxy(obj) {
        return ko.unwrap(obj);
      }
    }

    function noKnockoutFound() {
      // No knockout. Use our own observables.
      isObservable = function computeIsObservable(obj) {
        return obj._isObservable || false;
      }

      unwrap = function computeUnwrap(obj) {
        return obj.state.value;
      }

      computeSubscribe = function computeSubscribe(state, fn) {
        if (typeof fn !== 'function')
          throw new Error(MSGInvalidArgumentToSubscribe);
        state.subscriptions.push(fn);
      }

      computeCallSubscribers = function computeCallSubscribers(state) {
        var subscriptions = state.subscriptions;
        var value = state.value;
        for (var i = 0, len = subscriptions.length; i < len; i++) {
          subscriptions[i](value);
        }
      }

      computeObservableCall = function computeObservableCall(state, newValue) {
        if(typeof newValue === 'undefined')
          return state.value;

        if (state.isArray && !isArray(newValue))
          throw new Error(MSGInvalidArgumentsToObservableArray);

        var valueChanged = newValue !== state.value;
        state.value = newValue;
        if (valueChanged)
          Compute.computeCallSubscribers(state);
      }

      computeObservable = function computeObservable(value, thisIsAnArray) {
        if (thisIsAnArray && value !== null && (typeof value !== 'undefined') && !isArray(value))
          throw new Error(MSGInvalidArgumentsToObservableArray);

        var state = {
          value         : thisIsAnArray ? (value || []) : value,
          subscriptions : [],
          isArray       : thisIsAnArray
        };

        var result = function (newValue) {
          return Compute.computeObservableCall(state, newValue);
        }

        result.state = state;
        result.subscribe = function (fn) {
          Compute.computeSubscribe(state, fn);
        }

        result._isObservable = true;
        if (thisIsAnArray) {
          result.push = function computeObservableArrayPush(newItem) {
            state.value.push(newItem);
            Compute.computeCallSubscribers(state);
            return state.value.length;
          };

          result.pop = function computeObservableArrayPop() {
            var value = state.value;
            if (value.length === 0)
              return;

            var item = state.value.pop();
            Compute.computeCallSubscribers(state);
            return item;
          }
        }

        return result;
      };

      observable = computeObservable;
      observableArray = function computeObservableProxyForArray(value) {
        return computeObservable(value, true);
      }
    }


    try {
      // We have knockout. Use KO's observables and utilities
      // in node, require('knockout') works while in browser, require('ko')
      ko = require('knockout') || require('ko');
      if (ko)
        knockoutFound(ko);
      else
        noKnockoutFound(ko);

    } catch (err) {
      noKnockoutFound();
    }


    /* ****************************************************************************
     * Implement Compute.on and Compute.from
     * ****************************************************************************/


    /**
     * Ensure that all observables areally are observables and that func is a function.
     * @param {Array} observables
     * @param {function} func
     * @returns {boolean}
     */
    function isValid(observables, func) {
      if (isObservable(func))
        return false;

      if (typeof func !== 'function')
        return false;

      for (var i = 0, len = observables.length; i < len; i++) {
        if (!isObservable(observables[i]))
          return false;
      }

      return true;
    }

    /**
     * given an array of observables, return their values as an array
     * @param {Array} observables - The observables to be evaluated
     * @returns {Array} - Values of observables in observables array
     */
    function gather(observables) {
      var values = [];
      for (var i = 0, len = observables.length; i < len; i++) {
        values.push(unwrap(observables[i]));
      }
      return values;
    }

    /**
     * call a function whenever the value of specified observables is changed
     * @param {... n - 1} observables - The observables to be monitored
     * @param {function} handler - The function to be called
     */
    function computeOnChange() {
      var observables = Array.prototype.slice.apply(arguments);
      var handler = observables.pop();
      if (isValid(observables, handler)) {
        var stopped = false;
        var internalOnChangeHandler = function internalOnChangeHandler() {
          if (!stopped)
            handler.apply(null, gather(observables));
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
     * which gets its value from the compute function and the value of each source
     * observable. Update the value of this observable every time one of the
     * observables changes.
     * @param {... n - 1} observables - The observables to be monitored
     * @param {function} handler - The function to be called
     */
    function computeFrom() {
      var observables = Array.prototype.slice.apply(arguments);
      var handler = observables.pop();
      if (isValid(observables, handler)) {
        var newObservable = observable();
        var stopped = false;
        function internalOnChangeHandlerForFrom() {
          if (!stopped)
            newObservable(handler.apply(null, gather(observables)));
          return newObservable;
        }

        for (var i = 0, len = observables.length; i < len; i++)
          observables[i].subscribe(internalOnChangeHandlerForFrom);

        newObservable.$fire = internalOnChangeHandlerForFrom;
        newObservable.$stop = function() {
          stopped = true;
        };
        newObservable.$resume = function() {
          stopped = false;
        };

        return newObservable;
      } else {
        throw new Error(MSGInvalidArgumentToFrom);
      }
    }

    /* ****************************************************************************
     * API
     * Export as much as possible to facilitate testing.
     * ****************************************************************************/
     Compute = exports; // So that we can mock functions for testing
     // deprecated exports
     exports['_unwrap']                 = unwrap;

     // current
     exports['_gather']                 = gather;
     exports['_isValid']                = isValid;
     exports['unwrap']                  = unwrap;
     exports['_computeSubscribe']       = computeSubscribe;
     exports['_computeCallSubscribers'] = computeCallSubscribers;
     exports['_computeObservableCall']  = computeObservableCall;
     exports['_computeObservable']      = computeObservable;
     exports['isObservable']            = isObservable;
     exports['Observable']              = observable;
     exports['ObservableArray']         = observableArray;
     exports['o']                       = observable;
     exports['oa']                      = observableArray;
     exports['on']                      = computeOnChange;
     exports['from']                    = computeFrom;

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