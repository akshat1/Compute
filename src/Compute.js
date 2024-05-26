import { observable, isObservable } from "./Observable.js";

export { observable, isObservable };

// The following is supposed to work but it doesn't work either in VSCode or in JSDoc. Fun.
/** @typedef {import("./typedefs.js").Observer} Observer */
/** @typedef {import("./typedefs.js").Observable} Observable */
/** @typedef {import("./typedefs.js").Subscription} Subscription */

/**
 * Unpack all the observables and return an array of values
 * @param {...Observable} observables 
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
  const handleChange = () => fn(...gather(...observables));
  const subscriptions = observables.map(obs => obs.subscribe(handleChange));

  return {
    unsubscribe: () => subscriptions.forEach(subscription => subscription.unsubscribe()),
  };
};

/**
 * @interface SubscribedObservable
 * @extends Observable
 * @extends Subscription
 */

/**
 * @typedef {Function} ObservableValueCalculator
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
  o.unsubscribe = unsubscribe;
  return o;
}
