var injector = require('../injectdeps');

module.exports = injector(['db', 'arr', 'logger:promise'], function(db, arr, logger) {

  logger.then((obj) => {
    console.log(arguments, obj);
  });

  this.args = arguments;

  return this;
});

