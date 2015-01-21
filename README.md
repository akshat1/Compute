# Compute
An extremely simple reactive programming library using Knockout Observables.

Compute lets you describe relations between different observables (Compute will eventually have its own implementation of Observables, but it will always be compatible with Knockout). For example, 

    var a = Compute.o();
    var b = Compute.o();
    var c = Compute.from(a, b, function(a1, b1){
      return Math.sqrt(a*a + b*b)
    });
    a(3);
    b(4);
    console.log(c());   // 5

Now we change a, b

    a(5);
    b(12);
    console.log(c());   //13


To stop c from being updated, we need to call

   c.$stop();


Now remember knockout subscriptions are only triggered when the value of an observable changes. To force a relation to calculate immediately, we can call $fire like so

    var x = C.o(7);
    var y = C.o(22);
    var z = C.from(x, y function(x1, y1){
      return y1/x1;
    });
    z(); //undefined, because neither x nor y have changed
    z.$fire();
    z(); //3.14 .... blah ....

We can also tell Compute to execute a function everytime an observable changes.

    Compute.on(c, function(c1){
      console.log("C just got set to " + c1);
    });

Or, multiple observables

    Compute.on(a, b, c, function(a1, b1, c1){
      console.log(a1 + "^2 + " + b1 + "^2 = " + c1 + "^2");
    });

We also have obervable arrays, and we can define from, and on from them just the same. Or use observables and observable arrays in the same expression.

You will notice one can do all these things with plain knockout. However, Compute makes it much easier to define these relations, especially for multiple observables.

Having defined these relations, you can simply bind your variables to your DOM using knockout bindings as usual, because 

    C.o and C.from return a ko.Observable
    C.oa returns a ko.ObservableArray


