# Compute [![Build Status](https://travis-ci.org/akshat1/compute.svg?branch=master)](https://travis-ci.org/akshat1/compute)
An extremely simple reactive programming library using Observables.

## Wait, what is an Observable?

An observable variable is a function, which holds a value. You can get the value by calling the function without any arguments, and you update the value by calling the function _with_ the desired new value.

The useful thing about an observable is that you can choose to be notified every time the value of this observable changes.

```js
import { observable, onChange } from "compute";

// Create a new observable.
const o1 = observable(42);

// Access the value
console.log(o1()); // Logs 42

// Subscribe to it
const mySubscription = onChange(newValue => console.log(newValue), o1);

// Update the value
o1(84);  // Console shows 84

// You won't get notified until the value changes (strict equality).
o1(84);  // Nothing happens.

// Stop getting notifications
mySubscription.unsubscribe();
```

## `onChange` : React to observable value changes.

As demonstrated above, `onChange` let's you subscribe to observables. In fact, you can also subscribe to multiple variables.

```js
import {observable, onChange} from "compute";
const a = observable(1);
const b = observable(2);
const c = observable(3);
const sum = (x, y, z) => console.log(`The sum is ${x + y + z}`);
onChange(sum, a, b, c); // Nothing happens so far
a(2); // Console shows "The sum is 7"
b(3); // Console shows "The sum is 8"
```

## `from()` : Define an observable based on the value of other observables.

```js
import {observable, onChange, from} from "compute";
const a = observable(1);
const b = observable(2);
const c = observable(3);
const getSum = (...values) => values?.reduce(val, x => x + val, 0);
const sum = from(
  getSum,
  a,
  b,
  c,
);
console.log(sum()); // Prints 6
a(2);
console.log(sum()); // Prints 7

// And because sum is an observable, you can subscribe to it.
when(sum, x => console.log(x));
a(3); // Console shows 8
b(3); // Console shows 9
c(0); // Console shows 6
```