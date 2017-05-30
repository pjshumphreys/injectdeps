module.exports = function(deps, constructor) {
  if(!Array.isArray(deps) ||
    notOnlyStrings(deps) ||
    typeof constructor !== 'function') {
    throw new Error ('Parameters to injector were not an array of strings then a function');
  }

  return new InnerConstructor(deps, constructor);
}

module.exports.getContainer = function(){
  return new Container();
}

function notOnlyStrings(deps) {
  var i, len;

  for(i = 0, len = deps.length; i < len; i++) {
    if(typeof deps[i] !== 'string') {
      return true;
    }
  }

  return false;
}

function InnerConstructor(deps, constructor) {
  this.deps = deps;
  this.constructor = constructor;
}

function Container() {
  this.available = {};

  return this;
}

Container.prototype.loadPlugin = function(plugin) {
  if(typeof plugin !== 'function') {
    throw new Error("Was passed a plugin that isn't a function");
  }

  plugin(this);

  return this;
}

Container.prototype.bindName = function(name) {
  return {
    toPlainObject: val => {
      this.available[name] = new InnerConstructor([], () => val);

      return this;
    },
    toContainer: () => {
      this.available[name] = this;

      return this;
    },
    toObject: returnedVal => {
      if(!(returnedVal instanceof InnerConstructor)) {
        throw new Error('Tried to bind a name to something not created by injector');
      }

      this.available[name] = returnedVal;

      return this;
    },
    toStringValue: val => {
      let err, str;
      try {
        str = JSON.stringify(val);
      }
      catch(err) {
        throw new Error('Tried to bind a name to a value that could not be stringified');
      }

      this.available[name] = new InnerConstructor([], () => str);

      return this;
    },
    toScalarValue: val => {
      switch(typeof val) {
        case 'string':
        case 'number':
        case 'boolean': {
          this.available[name] = new InnerConstructor([], () => val);
        } break;

        default: {
          throw new Error('Tried to bind a name to a non scalar value');
        } break;
      }

      return this;
    }
  }
}

Container.prototype.newObject = function(name) {
  //check the type of the input parameter
  if(typeof name !== 'string') {
      throw new Error('didn\'t specify a bound object name as a string');
  }

  //manage circular depenancies
  var circleBreaker = {};

  //track how we got to a circular dependancy (in order to log errors)
  var circleChain = [];

  //know whether a dependancy has already been satisfied
  var satisfiedDeps = {};

  //keep track of other dependancies that are yet to be satisfied
  var promisesForName = {};

  //generic utility variables
  var retval, i, len, key, obj, err;

  try {
    retval = innerGet(this, name, circleBreaker, circleChain, satisfiedDeps, promisesForName);

    //resolve any promises that haven't been resolved yet
    for(key in promisesForName) {
      obj = innerGet(this, key, circleBreaker, circleChain, satisfiedDeps, promisesForName);
      satisfiedDeps[key] = obj;

      for(i = 0, len = promisesForName[key].length; i < len; i++) {
        promisesForName[key][i](obj);
      }

      delete promisesForName[key];
    }

    return retval;
  }
  catch(err) {
    switch(err.message) {
      case 'circle': {
        throw new Error('A circular set of dependancies was formed: '+circleChain.join('->')+ '->'+ err.depName);
      } break;

      case 'notfound': {
        throw new Error('A depandancy named "'+ err.depName + '" was used without being bound from (' + circleChain.join('->') + ')')
      } break;
    }

    throw err;
  }
}

var regex = /:promise$/;

function wrapInnerGet(self, name, circleBreaker, circleChain, satisfiedDeps, promisesForName) {
  try {
    return innerGet.apply(self, arguments);
  }
  catch(err) {
    switch(err.message) {
      case 'circle': {
        throw new Error('A circular set of dependancies was formed: '+circleChain.join('->')+ '->'+ err.depName);
      } break;

      case 'notfound': {
        throw new Error('A depandancy named "'+ err.depName + '" was used without being bound from (' + circleChain.join('->') + ')')
      } break;
    }

    throw err;
  }
}

function innerGet(self, name, circleBreaker, circleChain, satisfiedDeps, promisesForName) {
  var deps;
  var resolvedDeps = [];
  var i, len, obj, err;
  var returnPromise = false;

  if(regex.test(name)) {
    returnPromise = true;
    name = name.replace(regex, '');
  }

  if(!self.available.hasOwnProperty(name)) {
    err = new Error('notfound');
    err.depName = name;
    throw err;
  }

  if(returnPromise) {
    return new Promise(resolve => {
      if(satisfiedDeps.hasOwnProperty(name)) {
        resolve(satisfiedDeps[name]);
      }
      else {
        if(!promisesForName.hasOwnProperty(name)) {
          promisesForName[name] = [];
        }

        promisesForName[name].push(resolve);
      }
    });
  }

  if(circleBreaker.hasOwnProperty(name)) {
    err = new Error('circle');
    err.depName = name;
    throw err;
  }

  circleBreaker[name] = true;
  circleChain.push(name);

  //for each dependancy, satisfy it first
  deps = self.available[name].deps;

  for(i = 0, len = deps.length; i < len; i++) {
    //handle if the specified dependancy is the injector itself
    if(self.available[deps[i]] === self) {
      resolvedDeps.push({
        hasObject: (innerName) => {
          return self.available.hasOwnProperty(innerName);
        },
        getObject: (innerName) => {
          if(!satisfiedDeps.hasOwnProperty(innerName)) {
            satisfiedDeps[innerName] = wrapInnerGet(self, innerName, circleBreaker, circleChain, satisfiedDeps, promisesForName);
          }

          return satisfiedDeps[innerName];
        }
      });
    }
    //otherwise, do normal behaviour
    else {
      resolvedDeps.push(
        satisfiedDeps.hasOwnProperty(deps[i]) ?
        satisfiedDeps[deps[i]] :
        innerGet(self, deps[i], circleBreaker, circleChain, satisfiedDeps, promisesForName)
      );
    }
  }

  obj = self.available[name].constructor.apply({}, resolvedDeps);

  satisfiedDeps[name] = obj;

  //if this dependancy is promised to other ones, resolve each with our obj
  if(promisesForName.hasOwnProperty(name)) {
    for(i = 0, len = promisesForName[name].length; i< len; i++) {
      promisesForName[name][i](obj);
    }

    delete promisesForName[name];
  }

  delete circleBreaker[name];
  circleChain.pop();

  return obj;
}
