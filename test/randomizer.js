module.exports = require('../injectdeps')(['Math'], function(Math) {
  this.rand = Math.random();
  return this;
});
