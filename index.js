'use strict';

var binders = [];

module.exports = {
  
  // This is the interface that would be used by modules that take
  // callbacks and put them in their own queue; breaking async context
  // propagation. Before putting the callback into the queue, they
  // can call this bind function which returns a bound version of the
  // callback (if necessary) that ensures that all registered context
  // observers see the correct async context for this callback.
  bind: function(callback) {
    binders.forEach(function(binder) {
      callback = binder(callback);
    });
    return callback;
  },

  // A context observer (e.g. continuation-local-storage, NewRelic, etc.)
  // would use register/unregister to declare their intent to monitor
  // async tasks. Domains or Zones, if active, are automatically handled.
  register: function(bindFunction) {
    if (typeof bindFunction !== 'function') {
      throw new Error('argument must be a function');
    }
    if (typeof bindFunction(function() {}) !== 'function') {
      throw new Error('bindFunction must return a function')
    }
    binders.push(bindFunction);
  },

  unregister: function(bindFunction) {
    var index = binders.indexOf(bindFunction);
    if (index === -1) {
      throw new Error('unable to find function to unregister');
    }
    binders.splice(index, 1);
  }
};

module.exports.register(function domainBinder(callback) {
  return process.domain ? process.domain.bind(callback) : callback;
});

// In anticipation of the Zone spec.
// https://github.com/domenic/zones
if (typeof Zone !== 'undefined' &&
    typeof Zone.current === 'function' &&
    typeof Zone.current().wrap === 'function') {
  module.exports.register(function zoneBinder(callback) {
    return Zone.current().wrap(callback);
  });
}
