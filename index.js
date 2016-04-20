'use strict';

var binders = [];

module.exports = {
  bind: function(callback) {
    binders.forEach(function(binder) {
      callback = binder(callback);
    });
    return callback;
  },

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
