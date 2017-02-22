module.exports = require('../injectdeps')(['logger', 'text'], function(logger, text) {
  this.hello = text;
  this.foo = logger.foo;

  return this;
});

