import { observable, isObservable } from "./Observable.js";

export { observable, isObservable };

/** @module Compute */

/**
 * Unpack all the observables and return an array of values
 * @param {...import('./Observable').Observable} observables 
 * @returns {any[]}
 */
export const gather = (...observables) => observables.map(obs => obs());

/**
 * @callback MultiObserver
 * @param {any[]} values
 */

/**
 * Call the supplied function when any of the observables change. The function will be called with the current values of the observables.
 * @param {MultiObserver} fn 
 * @param  {...Observable} observables 
 * @returns {Subscription}
 * 
 * @example
 * ```
 * const obs1 = observable(1);
 * const obs2 = observable(2);
 * const obs3 = observable(3);
 * onChange((a, b, c) => console.log(a + b + c), obs1, obs2, obs3);
 * obs1(2);  // logs 7
 * obs2(3);  // logs 8
 * obs3(4);  // logs 9
 * ```
 */
export const onChange = (fn, ...observables) => {
  const handleChange = () => {
    console.log("[onChange] handleChange called", gather(...observables));
    return fn(...gather(...observables));
  };
  const subscriptions = observables.map(obs => obs.subscribe(handleChange));
  return {
    unsubscribe: () => subscriptions.forEach(subscription => subscription.unsubscribe()),
  };
};

/**
 * @interface SubscribedObservable
 * @extends import('./Observable').Observable
 * @extends import('./Observable').Subscription
 */

/**
 * @type ObservableValueCalculator
 * @extends Function
 * @param {any[]} observableValues
 * @returns {*}
 */

/**
 * @memberof Compute
 * @param {ObservableValueCalculator} fn 
 * @param  {...Observable} observables 
 * @returns {SubscribedObservable}
 */
export function from(fn, ...observables) {
  const o = observable(fn(...gather(...observables)));
  const handleChange = (...newValues) => {
    console.log("[from] handleChange called", newValues, "=>", fn(...newValues));
    return o(fn(...newValues));
  };
  const { unsubscribe } = onChange(handleChange, ...observables);
  /// @ts-ignore We are adding a property to the observable object
  o.unsubscribe = unsubscribe;
  /// @ts-ignore Rarely does one realise how we are giving up pro features trying to cater to the lowest common denominator
  return o;
}
