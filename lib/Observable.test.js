import test from "node:test";
import { observable, isObservable } from "./Observable.js";
import assert from "node:assert";

test("Observable", async (t) => {
  await t.test("should create an observable", async () => {
    const obs = observable(1);
    assert.strictEqual(obs(), 1);
  });

  await t.test("should update the value of an observable", async () => {
    const obs = observable(2);
    obs(3);
    assert.strictEqual(obs(), 3);
  });

  await t.test("should notify subscribers when the value changes", async () => {
    const obs = observable(3);
    let notifiedValue;
    obs.subscribe((newValue) => {
      notifiedValue = newValue;
    });
    obs(4);
    assert.strictEqual(notifiedValue, 4);
  });

  await t.test("should notify multiple subscribers when the value changes", async () => {
    const obs = observable(4);
    let notifiedValue1;
    let notifiedValue2;
    obs.subscribe((newValue) => {
      notifiedValue1 = newValue;
    });
    obs.subscribe((newValue) => {
      notifiedValue2 = newValue;
    });
    obs(5);
    assert.strictEqual(notifiedValue1, 5);
    assert.strictEqual(notifiedValue2, 5);
  });

  await t.test("multiple subscribe calls should result in a single subscription", async () => {
    const obs = observable(5);
    const observer = () => {};
    const subscription1 = obs.subscribe(observer);
    const subscription2 = obs.subscribe(observer);
    assert.strictEqual(subscription1, subscription2);
  });

  await t.test("repeated subscribe() calls should not result in multiple notifications", async () => {
    const obs = observable(6);
    let notifiedValue = 0;
    const observer = () => {
      notifiedValue++;
    };
    obs.subscribe(observer);
    obs.subscribe(observer);
    obs(7);
    assert.strictEqual(notifiedValue, 1);
  });

  await t.test("should not notify subscribers when the value does not change", async () => {
    const obs = observable(4);
    let notifiedValue;
    obs.subscribe((newValue) => {
      notifiedValue = newValue;
    });
    obs(4);
    assert.strictEqual(notifiedValue, undefined);
  });

  await t.test("should unsubscribe a subscriber", async () => {
    const obs = observable(5);
    let notifiedValue;
    const subscription = obs.subscribe((newValue) => {
      notifiedValue = newValue;
    });
    subscription.unsubscribe();
    obs(6);
    assert.strictEqual(notifiedValue, undefined);
  });

  await t.test("should not throw when unsubscribing a subscriber multiple times", async () => {
    const obs = observable(6);
    const subscription = obs.subscribe(() => {});
    subscription.unsubscribe();
    subscription.unsubscribe();
  });

  await t.test("should not throw when unsubscribing an unknown subscriber", async () => {
    const obs = observable(7);
    const subscription = obs.subscribe(() => {});
    subscription.unsubscribe();
    subscription.unsubscribe();
  });
});

test("isObservable", async (t) => {
  await t.test("should return true for an observable", () => {
    const obs = observable(1);
    assert.strictEqual(isObservable(obs), true);
  });

  await t.test("should return false for a non-observable", () => {
    assert.strictEqual(isObservable(1), false);
  });
});
