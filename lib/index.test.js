import test from "node:test";
import assert from "node:assert";
import { gather, isObservable, observable, from } from "./index.js";

test("Compute", async (t) => {
  await t.test("gather", async (t1) => {
    await t1.test("should return an array of values", () => {
      const obs1 = observable(1);
      const obs2 = observable(2);
      const obs3 = observable(3);
      assert.deepStrictEqual(gather(obs1, obs2, obs3), [1, 2, 3]);
    });
  });

  await t.test("from", async (t1) => {
    await t1.test("should create a computed observable", () => {
      const obs1 = observable(1);
      const obs2 = observable(2);
      const obs3 = observable(3);
      const computed = from((a, b, c) => a + b + c, obs1, obs2, obs3);
      assert.equal(isObservable(computed), true);
      assert.strictEqual(computed(), 6);
    });

    await t1.test("should update the computed value when the observables change", () => {
      const obs1 = observable(1);
      const obs2 = observable(2);
      const obs3 = observable(3);
      const computed = from((a, b, c) => a + b + c, obs1, obs2, obs3);
      obs1(2);
      obs2(3);
      obs3(4);
      console.log("computed is now ", computed());
      assert.strictEqual(computed(), 9);
    });
  });
});
