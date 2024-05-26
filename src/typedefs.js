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
 * @typedef {Function} SubscribeFunction
 * @param {Observer} observer
 * @returns {Subscription}
 */

/**
 * @typedef {Function} NotifyFunction
 * @description Calls all observers in sequence of subscription with new and old values.
 * @param {*} newValue
 * @param {*} oldValue
 */

/**
 * @interface Observable
 * @extends Function
 * @property {SubscribeFunction} subscribe - subscribe to the observable
 * @param {*} newValue
 * @returns {*} - current value
 */
