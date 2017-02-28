const expect = require('chai').expect;

describe('injectdeps', () => {
  it('should inject basic properties', () => {
    const app = require('../injectdeps').getContainer()
      .bindName('db').toObject(require('./test/db'))
      .bindName('logger').toObject(require('./test/logger'))
      .bindName('app').toObject(require('./test/module'))
      .bindName('text').toScalarValue('hello world')
      .bindName('arr').toPlainObject([1,2,3])
      .newObject('app').args;

    expect(app['0']).to.be.an('object')
      .that.has.property('hello')
      .that.equals('hello world');

    expect(app['1']).to.be.an('array').with.lengthOf(3);

    expect(app['2']).to.be.a('promise');
  });
  

  it('should reuse objects bound in singleton scope', (done) => {
    const singletonHost = require('../injectdeps')(['container'], function(container){
      const obj1 = container.getObject('obj');
      const obj2 = container.getObject('obj');
      expect(obj1).to.equal(obj2);
      done();
    });
    
    const container = require('../injectdeps').getContainer()
      .bindName('Math').toPlainObject(Math)
      .bindName('obj').toObject(require('./test/randomizer'))
      .bindName('container').toContainer()
      .bindName('singletonHost').toObject(singletonHost);

    const obj1 = container.newObject('obj');
    const obj2 = container.newObject('obj');
    expect(obj1).to.not.equal(obj2);
    
    container.newObject('singletonHost');
  });
});
