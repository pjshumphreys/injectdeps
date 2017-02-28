module.exports = require('../injectdeps')([], function() {
  this.rand = Math.random();
  return this;
});

