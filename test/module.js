var injector = require('../injector');

module.exports = injector(['db', 'logger:promise'], function(db, logger) {

  logger.then((obj) => {
    console.log(arguments, obj);
  });

  return this;
});

