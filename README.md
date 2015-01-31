# Compute
An extremely simple reactive programming library using Knockout style Observables.

Compute lets you describe relations between different observables. For example,

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

In the browser, Compute will automatically use knockout observables (instead of Compute's implementation) if you are using knockout. Then, you can use C.o and C.oa in your knockout viewmodel because C.o and C.oa are actually ko.observable and ko.observableArray.
Remember you 'don't have to' use knockout to use Compute.

Compute loves the awesome Travis-CI.