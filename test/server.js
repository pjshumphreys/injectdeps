var injector = require('../injector').getContainer();

injector
  .bindName('db').toObject(require('./db'))
  .bindName('logger').toObject(require('./logger'))
  .bindName('app').toObject(require('./module'))
  .bindName('text').toScalarValue('hello world');

var app = injector.getObject('app');
