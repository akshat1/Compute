'use strict';

var should = chai.should();
var expect = chai.expect;

describe('Compute', function() {
  describe('isObservable', function() {
    it('should return true for an object with true _isObservable', function() {
      var testObj = {
        _isObservable: true
      };

      Compute.isObservable(testObj).should.be.true;
    });


    it('should return false for an object without true _isObservable', function() {
      var testObj = {};
      Compute.isObservable(testObj).should.be.false;
    });
  }); //describe('isObservable', function() {


  describe('unwrap', function() {
    it('should return argument.state.value', function() {
      var expectedValue = 'EXPECTED OBSERVABLE VALUE';
      var testObj = {
        state: {
          value: expectedValue
        }
      };

      Compute.unwrap(testObj).should.equal(expectedValue);
      Compute._unwrap(testObj).should.equal(expectedValue);
    });
  }); //describe('unwrap', function() {


  describe('computeSubscribe', function() {
    var fn, state;

    beforeEach(function() {
      fn = new Function();
      state = {
        subscriptions: []
      };
    });

    it('should add fn to state.subscriptions', function() {
      Compute._computeSubscribe(state, fn);
      state.subscriptions[0].should.equal(fn);
    });

    it('should add only one item to state.subscriptions', function() {
      Compute._computeSubscribe(state, fn);
      state.subscriptions.length.should.equal(1);
    });

    it('should throw exception if fn is not function', function() {
      var wrapper = function wrapper() {
        Compute._computeSubscribe(state, {});
      };

      wrapper.should.throw(Compute.MSGInvalidArgumentToSubscribe);
    });
  });//describe('computeSubscribe', function() {


  describe('computeCallSubscribers', function() {
    it('should call each subscriber once with the correct value', function() {
      var expectedValue = 'EXPECTED OBSERVABLE VALUE';
      var subscriptions = [
          sinon.spy(),
          sinon.spy(),
          sinon.spy(),
          sinon.spy(),
          sinon.spy()
        ];
      var state = {
        subscriptions: subscriptions,
        value: expectedValue
      };

      Compute._computeCallSubscribers(state);
      for(var i = 0, len = subscriptions.length; i < len; i++) {
        var spy = subscriptions[i];
        spy.callCount.should.equal(1);
        spy.calledWithExactly(expectedValue);
      }
    })
  });//describe('computeCallSubscribers', function() {


  describe('computeObservableCall', function() {
    it('should return observable value if called with no params', function() {
      var expectedValue = 'EXPECTED OBSERVABLE VALUE';
      var state = {
        value: expectedValue
      };
      Compute._computeObservableCall(state).should.equal(expectedValue);
    });

    it('should throw error if called with non-array param when called for observableArray', function() {
      var state = {
        isArray: true
      };

      var wrapperFn = function() {
        Compute._computeObservableCall(state, {});
      };
      wrapperFn.should.throw(Compute.MSGInvalidArgumentsToObservableArray);
    });

    it('should call computeCallSubscribers if value changed', function() {
      var state = {
        value: 'oldValue'
      };
      var newValue = 'newValue';
      var newState = {
        value: newValue
      };

      var tmp = Compute._computeCallSubscribers;
      var spy = Compute._computeCallSubscribers = sinon.spy();
      Compute._computeObservableCall(state, newValue);
      spy.callCount.should.equal(1);
      spy.calledWith(newState).should.be.true;
      Compute._computeCallSubscribers = tmp;
    });
  });//describe('computeObservableCall', function() {


  describe('computeObservable', function() {
    it('should return an observable', function() {
      var result0 = Compute._computeObservable();
      var result1 = Compute._computeObservable(45);
      var result2 = Compute._computeObservable(null, true);
      var result3 = Compute._computeObservable(undefined, true);
      var result4 = Compute._computeObservable([], true);
      result0._isObservable.should.be.true;
      result1._isObservable.should.be.true;
      result2._isObservable.should.be.true;
      result3._isObservable.should.be.true;
      result4._isObservable.should.be.true;
    });

    it('should throw an error if called with def and non-array param while creating observableArray', function() {
      var wrapperFn = function() {
        Compute._computeObservable({}, true);
      }
      wrapperFn.should.throw(Compute.MSGInvalidArgumentsToObservableArray);
    });

    it('should set value to be [] if called with null param while creating observableArray', function() {
      var observableArray = Compute._computeObservable(null, true);
      observableArray.state.value.should.eql([]);
    });

    it('should set isArray true when creating observableArray', function() {
      var observableArray = Compute._computeObservable(null, true);
      observableArray.state.isArray.should.be.true;
    });

    it('should set value undef if called with undef param when creating non-array observable', function() {
      var observable = Compute._computeObservable();
      expect(observable.state.value).to.be.undefined;
    });

    it('should return a function which calls computeObservableCall', function() {
      var tmp = Compute._computeObservableCall;
      var spy = Compute._computeObservableCall = sinon.spy();
      var newValue = 34;
      var observable = Compute._computeObservable();
      observable(newValue);
      spy.callCount.should.equal(1);
      spy.calledWithExactly(observable.state, newValue);
      Compute._computeObservableCall = tmp;
    });

    it('should return a result with subscribe function, which calls computeSubscribe', function() {
      var tmp = Compute._computeSubscribe;
      var spy = Compute._computeSubscribe = sinon.spy();
      var observable = Compute._computeObservable();
      var testParam = 'TESTPARAM'; //Doesn't need to be function since we mocked computeSubscribe
      observable.subscribe(testParam);
      spy.callCount.should.equal(1);
      spy.calledWithExactly(observable.state, testParam).should.be.true;
      Compute._computeSubscribe = tmp;
    });

    it('adds push and pop methods for observableArrays', function() {
      var observableArray = Compute._computeObservable([], true);
      observableArray.push.should.be.a('function');
      observableArray.pop.should.be.a('function');
    })

    describe('push', function() {
      it('should add push new item into the value array', function() {
        var observableArray = Compute._computeObservable([], true);
        var newItem0 = 'NEWITEM0';
        var newItem1 = 'NEWITEM1';
        var newItem2 = 'NEWITEM2';
        var newItem3 = 'NEWITEM3';
        observableArray.push(newItem0);
        observableArray.state.value.should.have.members([newItem0]);
        observableArray.push(newItem1);
        observableArray.state.value.should.have.members([newItem0, newItem1]);
        observableArray.push(newItem2, newItem3, newItem1);
        observableArray.state.value.should.have.members([newItem0, newItem1, newItem2, newItem3, newItem1]);
      })
    });

    describe('pop', function() {
      it('should remove the last item from the value array', function() {
        var poppedItem;
        var item0 = 'ITEM0';
        var item1 = 'ITEM1';
        var observableArray = Compute._computeObservable([item0, item1], true);
        poppedItem = observableArray.pop();
        poppedItem.should.equal(item1);
        observableArray.state.value.should.have.members([item0]);
        poppedItem = observableArray.pop();
        poppedItem.should.equal(item0);
        observableArray.state.value.should.have.members([]);
        poppedItem = observableArray.pop();
        expect(poppedItem).to.be.an('undefined');
      })
    });
  });//describe('computeObservable', function() {


  describe('Observable', function() {
    it('should be the same as _computeObservable and C.o', function() {
      Compute.Observable.should.equal(Compute._computeObservable);
      Compute.Observable.should.equal(Compute.o);
    });
  });//describe('Observable', function() {


  describe('ObservableArray', function() {
    it('should call _computeObservable with isArray true', function() {
      var expectedArray = [1, 2, 3, 4, 5];
      var expectedResult = {};
      var tmp = Compute._computeObservable;
      var stub = Compute._computeObservable = sinon.stub();
      stub.returns(expectedResult);
      var result = Compute.ObservableArray(expectedArray);
      result.should.equal(expectedResult);
      stub.callCount.should.equal(1);
      var receivedArgs = stub.getCall(0).args;
      receivedArgs[0].should.have.members(expectedArray);
      receivedArgs[1].should.be.true;
      Compute._computeObservable = tmp;
    })

    it('should be the same as Compute.oa', function() {
      Compute.oa.should.equal(Compute.ObservableArray);
    });
  });//describe('ObservableArray', function() {


  describe('_isValid', function() {
    it('should return false if func is an observable', function() {
      Compute._isValid([Compute.o(), Compute.o()], Compute.o()).should.be.false;
    });

    it('should return false if func is not a function', function() {
      Compute._isValid([Compute.o(), Compute.o(), Compute.o()], {}).should.be.false;
    });

    it('should return false if any of the observables argument isnt an observable', function() {
      Compute._isValid([Compute.o(), {}, Compute.o()], function(){}).should.be.false;
    });

    it('should return true when all observables are observables and the func is a function', function() {
      Compute._isValid([Compute.o(), Compute.o(), Compute.o()], function(){}).should.be.true;
    })
  });//describe('_isValid', function()


  describe('_gather', function() {
    it('should return unwrapped values of all the observables', function() {
      var expectedArray = [3, 56, 82, 1];
      var result = Compute._gather([
        Compute.o(3),
        Compute.o(56),
        Compute.o(82),
        Compute.o(1)
        ]);
      result.should.have.members(expectedArray);
    });
  });//describe('_gather', function() {

  describe('computeOnChange', function() {
    it('should throw exception on invalid params', function() {
      var tmp = Compute._isValid;
      var stub = Compute._isValid = sinon.stub();
      var expectedArg0 = 0;
      var expectedArg1 = 1;
      var expectedArg2 = 3;
      stub.returns(false);
      var wrapper = function() {
        Compute.on(expectedArg0, expectedArg1, expectedArg2);
      }
      wrapper.should.throw(Compute.MSGInvalidArgumentToOnChange);
      stub.callCount.should.equal(1);
      stub.getCall(0).args.should.deep.have.members([[expectedArg0, expectedArg1], expectedArg2])
      Compute._isValid = tmp;
    });

    it('should call $fire with latest values when any observable changes', function() {
      var expectedArg0 = 0;
      var expectedArg1 = 1;
      var expectedArg2 = 2;
      var expectedArg3 = 3;
      var expectedArg4 = 4;
      var expectedArg5 = 5;
      var ob0 = Compute.o(expectedArg0);
      var ob1 = Compute.o(expectedArg1);
      var ob2 = Compute.o(expectedArg2);
      var handler = sinon.spy();
      Compute.on(ob0, ob1, ob2, handler);
      ob0(expectedArg3);
      handler.callCount.should.equal(1);
      handler.getCall(0).args.should.have.members([expectedArg3, expectedArg1, expectedArg2]);
      ob1(expectedArg4);
      handler.callCount.should.equal(2);
      ob2(expectedArg5);
      handler.callCount.should.equal(3);
      handler.getCall(1).args.should.have.members([expectedArg3, expectedArg4, expectedArg2]);
      handler.getCall(2).args.should.have.members([expectedArg3, expectedArg4, expectedArg5]);
    });

    describe('$fire', function() {
      it('should call handler with current values when called', function() {
        var expectedArg0 = 0;
        var expectedArg1 = 1;
        var expectedArg2 = 2;
        var ob0 = Compute.o(expectedArg0);
        var ob1 = Compute.o(expectedArg1);
        var ob2 = Compute.o(expectedArg2);
        var handler = sinon.spy();
        var thunk = Compute.on(ob0, ob1, ob2, handler);
        thunk.$fire();
        handler.callCount.should.equal(1);
        handler.getCall(0).args.should.have.members([expectedArg0, expectedArg1, expectedArg2]);
      });

      it('should not call handler after $stop has been called', function() {
        var expectedArg0 = 0;
        var expectedArg1 = 1;
        var expectedArg2 = 2;
        var ob0 = Compute.o(expectedArg0);
        var ob1 = Compute.o(expectedArg1);
        var ob2 = Compute.o(expectedArg2);
        var handler = sinon.spy();
        var thunk = Compute.on(ob0, ob1, ob2, handler);
        thunk.$stop();
        thunk.$fire();
        handler.callCount.should.equal(0);
      });

      it('should start calling handler after $resume has been called', function() {
        var expectedArg0 = 0;
        var expectedArg1 = 1;
        var expectedArg2 = 2;
        var ob0 = Compute.o(expectedArg0);
        var ob1 = Compute.o(expectedArg1);
        var ob2 = Compute.o(expectedArg2);
        var handler = sinon.spy();
        var thunk = Compute.on(ob0, ob1, ob2, handler);
        thunk.$stop();
        thunk.$fire();
        thunk.$resume();
        thunk.$fire();
        handler.callCount.should.equal(1);
        handler.getCall(0).args.should.have.members([expectedArg0, expectedArg1, expectedArg2]);
      });
    });//describe('$fire', function() {
  });//describe('computeOnChange', function() {


  describe('computeFrom', function() {
    it('should throw exception on invalid params', function() {
      var tmp = Compute._isValid;
      var stub = Compute._isValid = sinon.stub();
      var expectedArg0 = 0;
      var expectedArg1 = 1;
      var expectedArg2 = 3;
      stub.returns(false);
      var wrapper = function() {
        Compute.from(expectedArg0, expectedArg1, expectedArg2);
      }
      wrapper.should.throw(Compute.MSGInvalidArgumentToOnChange);
      stub.callCount.should.equal(1);
      stub.getCall(0).args.should.deep.have.members([[expectedArg0, expectedArg1], expectedArg2])
      Compute._isValid = tmp;
    });

    it('should call Compute.on with the said observables and its own changeHandler', function() {
      var ob0 = Compute.o(0);
      var ob1 = Compute.o(1);
      var ob2 = Compute.o(2);
      var fn  = function() {}
      var tmp = Compute.on;
      var stub = Compute.on = sinon.stub();
      stub.returns({});
      var resultOb = Compute.from(ob0, ob1, ob2, fn);
      stub.callCount.should.equal(1);
      stub.getCall(0).args.should.have.members([ob0, ob1, ob2, resultOb._internalChangeHandler]);
      Compute.on = tmp;
    });

    it('should update the result observable with the latest value as returned by the valueFunction', function() {
      var expectedArg0 = 0;
      var expectedArg1 = 1;
      var expectedArg2 = 2;
      var ob0 = Compute.o(expectedArg0);
      var ob1 = Compute.o(expectedArg1);
      var ob2 = Compute.o(expectedArg2);
      var resultOb = Compute.from(ob0, ob1, ob2, function(a, b, c) {
        return a + b + c;
      });
      resultOb.$fire();
      resultOb().should.equal(3);
    });
  });//describe('computeFrom', function() {

  describe('_defineFunction', function() {
    describe('_knockoutFound', function() {
      it('should refer methods from knockout', function() {
        var fakeKO = {
          observable      : function() {},
          observableArray : function() {},
          isObservable    : function() {},
          unwrap          : function() {}
        };
        Compute._knockoutFound(fakeKO);
        Compute.Observable.should.equal(fakeKO.observable);
        Compute.ObservableArray.should.equal(fakeKO.observableArray);
        Compute.isObservable.should.equal(fakeKO.isObservable);
        Compute.unwrap.should.equal(fakeKO.unwrap);
      });
    });//describe('_knockoutFound', function() {
  });//describe('_defineFunction', function() {
});//describe('Compute', function() {
