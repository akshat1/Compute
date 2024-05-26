import { SubscriptionManager } from "./SubscriptionManager.js";

/** @typedef {import("./typedefs.js").Observer} Observer */
/** @typedef {import("./typedefs.js").Observable} Observable */
/** @typedef {import("./typedefs.js").Subscription} Subscription */

/**
 * Get a new Observable instance intialized with the given value.
 * @param {*} initialValue 
 * @returns {Observable}
 */
export function observable(initialValue) {
  let value = initialValue;
  const subscriptionManager = new SubscriptionManager();

  /**
   * @type {Observable}
   * @param {*} [newValue] - If specified, the observable will be updated with this value.
   * @returns {*} - Current value. If newValue is specified, it will return the newValue.
   */
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
   * @returns {Subscription} - The subscription object which lets you unsubscribe from the observable.
   */
  actualObservable.subscribe = (observer) => subscriptionManager.subscribe(observer);

  return actualObservable;
}

/**
 * @param {*} value 
 * @returns {boolean}
 */
export const isObservable = (value) =>
  typeof value === 'function' && typeof value.subscribe === 'function';
