/**
 * @callback Observer
 * @param {*} newValue
 * @param {*} oldValue
 */

/**
 * @interface Subscription
 * @property {Function} unsubscribe
 */

/**
 * @interface Observable
 * @extends Function
 * @property {Function} subscribe - subscribe to the observable
 * @param {*} newValue
 * @returns {*} - current value
 */

/**
 * Get a new Observable instance intialized with the given value.
 * @param {*} initialValue 
 * @returns {Observable}
 */
export function observable(initialValue) {
  let value = initialValue;
  const observers = [];
  /**
   * @const
   * @type {Map<Observer, Subscription>}
   */
  const subscriptionsMap = new Map();

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
        observers.forEach(observer => observer(value, oldValue));
      }
    }

    return value;
  };

  /**
   * @param {Observer} observer 
   * @returns {Subscription} - The subscription object which lets you unsubscribe from the observable.
   */
  actualObservable.subscribe = (observer) => {
    if (subscriptionsMap.has(observer)) {
      return subscriptionsMap.get(observer);
    }

    observers.push(observer);

    const subscription = {
      unsubscribe() {
        const index = observers.indexOf(observer);
        if (index >= 0) {
          observers.splice(index, 1);
        }
      },
    };
    subscriptionsMap.set(observer, subscription);

    return subscription;
  };

  return actualObservable;
}

/**
 * @param {*} value 
 * @returns {boolean}
 */
export const isObservable = (value) =>
  typeof value === 'function' && typeof value.subscribe === 'function';
