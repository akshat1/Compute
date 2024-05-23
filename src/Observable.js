/**
 * @callback Observer
 * @template T
 * @param {T} newValue
 * @param {T} oldValue
 */

/**
 * @interface Subscription
 * @property {Function} unsubscribe
 */

/**
 * @interface Observable
 * @extends Function
 * @template T
 * @property {Function} subscribe
 * @param {T} newValue
 * @returns {}
 */

/**
 * @template T
 * @param {T} initialValue 
 * @returns {Observable<T>}
 */
export function observable(initialValue) {
  let value = initialValue;
  const observers = [];
  /**
   * @const
   * @type {Map<Observer<T>, Subscription>}
   */
  const subscriptionsMap = new Map();

  /**
   * @type {Observable<T>}
   * @param {T} newValue 
   * @returns {T}
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
   * @param {Observer<T>} observer 
   * @returns 
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
