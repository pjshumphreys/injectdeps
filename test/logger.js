var injector = require('../injectdeps');

module.exports = injector([], function() {

  this.foo = 'bar';

  return this;
});

