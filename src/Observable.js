import { SubscriptionManager } from "./SubscriptionManager.js";

/**
 * Get a new Observable instance intialized with the given value.
 * @param {*} initialValue 
 * @returns {import("./typedefs.js").Observable}
 * 
 * @example
 * const observableOne = observable(1);
 * const observableTwo = observable(2);
 */
export function observable(initialValue) {
  let value = initialValue;
  const subscriptionManager = new SubscriptionManager();

  function actualObservable (newValue) {
    if (arguments.length) {
      const oldValue = value;
      value = newValue;
      if (oldValue !== value) {
        subscriptionManager.notify(value, oldValue);
      }
    }

    return value;
  };

  /**
   * @param {Observer} observer 
   * @returns {import("./typedefs.js").Subscription} - The subscription object which lets you unsubscribe from the observable.
   */
  actualObservable.subscribe = (observer) => subscriptionManager.subscribe(observer);

  return actualObservable;
}

/**
 * @param {*} value 
 * @returns {boolean}
 */
export function isObservable (value) {
  return typeof value === 'function' && typeof value.subscribe === 'function';
}
