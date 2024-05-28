/**
 * @class
 * @description Provides a way to manage subscriptions and notify observers. Used internally by Observable and ObservableList, not meant to be used directly.
 */
export function SubscriptionManager() {
  /**
   * Used to call observers in order.
   * @type {import("./typedefs.js").Subscription[]}
   * @private
   */
  const subscriptionsList = [];
  /**
   * Used to prevent duplicate subscriptions.
   * @type {Map<import("./typedefs.js").Observer, import("./typedefs.js").Subscription>}
   * @private
   */
  const subscriptionsMap = new Map();

  /**
   * Adds the provided observer to the list of subscriptions, and returns a Subscription object which can be used to unsubscribe from notifications.
   * @param {import("./typedefs.js").Observer} observer
   * @returns {import("./typedefs.js").Subscription}
   */
  this.subscribe = (observer) => {
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
   * @param {*} newValue
   * @param {*} oldValue
   */
  this.notify = (newValue, oldValue) => {
    subscriptionsList.forEach(subscription => subscription(newValue, oldValue));
  };
}
