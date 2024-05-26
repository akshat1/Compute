/** @typedef {import("./typedefs.js").Subscription} Subscription */
/** @typedef {import("./typedefs.js").SubscribeFunction} SubscribeFunction */
/** @typedef {import("./typedefs.js").NotifyFunction} NotifyFunction */
/** @typedef {import("./typedefs.js").Observer} Observer */

/**
 * @class
 * @description Provides a way to manage subscriptions and notify observers. USed internally by Observable and ObservableList.
 * @property {NotifyFunction} notify
 */
export function SubscriptionManager() {
  /**
   * Used to call observers in order.
   * @type {Subscription[]}
   */
  const subscriptionsList = [];
  /**
   * Used to prevent duplicate subscriptions.
   * @type {Map<Observer, Subscription>}
   */
  const subscriptionsMap = new Map();

  /**
   * @property {SubscribeFunction} subscribe
   */
  const subscribe = (observer) => {
    if (subscriptionsMap.has(observer)) {
      return subscriptionsMap.get(observer);
    }

    const unsubscribe = () => {
      const index = subscriptionsList.indexOf(observer);
      if (index >= 0) {
        subscriptionsList.splice(index, 1);
      }
      subscriptionsMap.delete(observer);
    };

    const subscription = { unsubscribe };
    subscriptionsList.push(observer);
    subscriptionsMap.set(observer, subscription);
    return subscription;
  };

  /**
   * @property {NotifyFunction} notify
   */
  const notify = (newValue, oldValue) => {
    subscriptionsList.forEach(subscription => subscription(newValue, oldValue));
  };

  Object.assign(this, {
    subscribe,
    notify,
  });
}
