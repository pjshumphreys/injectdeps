const expect = require('chai').expect;

describe('injectdeps', () => {
  it('should inject basic properties', () => {
    const app = require('../injectdeps').getContainer()
      .bindName('db').toObject(require('./test/db'))
      .bindName('logger').toObject(require('./test/logger'))
      .bindName('app').toObject(require('./test/module'))
      .bindName('text').toScalarValue('hello world')
      .bindName('arr').toConstant([1,2,3])
      .getObject('app').args;

    expect(app['0']).to.be.an('object')
      .that.has.property('hello')
      .that.equals('hello world');

    expect(app['1']).to.be.an('array').with.lengthOf(3);

    expect(app['2']).to.be.a('promise');
  });

  it('should reuse objects binded in singleton scope', () => {
    const container = require('../injectdeps').getContainer()
      .bindName('transient-obj').toObject(require('./test/randomizer'))
      .bindName('singleton-obj').inSingletonScope().toObject(require('./test/randomizer'));

    const tobj1 = container.getObject('transient-obj');
    const tobj2 = container.getObject('transient-obj');
    expect(tobj1).to.not.equal(tobj2);

    const sobj1 = container.getObject('singleton-obj');
    const sobj2 = container.getObject('singleton-obj');
    expect(sobj1).to.equal(sobj2);
  });
});