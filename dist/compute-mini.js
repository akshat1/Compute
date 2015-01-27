(function(){var r,n,e,t,u,o,i,s,a={}.hasOwnProperty,f=function(r,n){function e(){this.constructor=r}for(var t in n)a.call(n,t)&&(r[t]=n[t]);return e.prototype=n.prototype,r.prototype=new e,r.__super__=n.prototype,r},l=[].slice;r={},n=function(r){function n(){n.__super__.constructor.call(this,"Argument to observable array must be null, undefined or Array")}return f(n,r),n}(Error),e=function(r){var n,e,t,u;return u=r,t=[],n=function(){var r,n,e,o;for(o=[],n=0,e=t.length;e>n;n++)r=t[n],o.push(r(u));return o},e=function(r){var e;return arguments.length>0?(e=u!==r,u=r,e?n():void 0):u},e.subscribe=function(r){return t.push(r)},e._isObservable=!0,e},t=function(r){var e,t,u,o;if(o=r||[],!(o instanceof Array))throw new n;return u=[],e=function(){var r,n,e,t;for(t=[],n=0,e=u.length;e>n;n++)r=u[n],t.push(r(o));return t},t=function(r){return arguments.length>0?(o=r,e()):o},t.subscribe=function(r){return u.push(r)},t.push=function(r){return o.push(r),e()},t.pop=function(){var r;return r=o.pop(),e(),r},t.peek=function(){return o[o.length-1]},t._isObservable=!0,t},o=function(r){return"undefined"!=typeof ko?ko.isObservable(r):r._isObservable},s=function(r){return o(r)?r():r},i=function(r,n){var e;return function(){var n,t,u;for(u=[],n=0,t=r.length;t>n;n++)e=r[n],u.push(o(e));return u}()?o(n)?!1:"function"!=typeof n?!1:!0:!1},u=function(r){var n,e,t,u;for(e=[],t=0,u=r.length;u>t;t++)n=r[t],e.push(s(n));return e},r.o=function(r){return"undefined"!=typeof ko?ko.observable(r):e(r)},r.oa=function(r){return"undefined"!=typeof ko?ko.observableArray(r):t(r)},r.on=function(){var r,n,e,t,o,s,a,f;if(o=2<=arguments.length?l.call(arguments,0,s=arguments.length-1):(s=0,[]),r=arguments[s++],!i(o,r))throw new Error("Invalid arguments to C.on");for(e=!1,n=function(){return e?void 0:r.apply(null,u(o))},a=0,f=o.length;f>a;a++)t=o[a],t.subscribe(n);return{$fire:n,$stop:function(){return e=!0},$resume:function(){return e=!1}}},r.from=function(){var n,e,t,o,s,a,f,c,p;if(a=2<=arguments.length?l.call(arguments,0,f=arguments.length-1):(f=0,[]),n=arguments[f++],!i(a,n))throw new Error("Invalid arguments to C.on");for(o=r.o(),t=!1,e=function(){var r;if(!t)return r=n.apply(null,u(a)),o(r),o},c=0,p=a.length;p>c;c++)s=a[c],s.subscribe(e);return o.$fire=e,o.$stop=function(){return t=!0},o.$resume=function(){return t=!1},o},r._gather=u,r._isValid=i,r.Observable=e,r.ObservableArray=t,r.InvalidObservableArrayArgumentsError=n,"undefined"!=typeof window?window.Compute=r:module&&(module.exports=r)}).call(this);