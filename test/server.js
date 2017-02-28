var injector = require('../injectdeps').getContainer();

injector
  .bindName('db').toObject(require('./db'))
  .bindName('logger').toObject(require('./logger'))
  .bindName('app').toObject(require('./module'))
  .bindName('text').toScalarValue('hello world')
  .bindName('arr').toConstant([1,2,3]);

var app = injector.getObject('app');
