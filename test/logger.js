var injector = require('../injector');

module.exports = injector([], function() {

  this.foo = 'bar';

  return this;
});

