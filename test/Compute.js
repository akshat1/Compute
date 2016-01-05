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

    /*
    describe('push', function() {
      it('should add push new item into the value array', function() {
        var observableArray = Compute._computeObservable([], true);
        var newItem0 = 'NEWITEM0';
        var newItem1 = 'NEWITEM1';
        observableArray.push(newItem0);
        console.dir(observableArray.state);
        observableArray.state.value.should.equal([newItem0]);
        observableArray.push(newItem1);
        observableArray.state.value.should.equal([newItem0, newItem1]);
      })
    });*/
  });//describe('computeObservable', function() {
});