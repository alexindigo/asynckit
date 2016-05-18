# asynckit [![NPM Module](https://img.shields.io/npm/v/asynckit.svg?style=flat)](https://www.npmjs.com/package/asynckit)

Minimal async jobs utility library.

[![PhantomJS Build](https://img.shields.io/travis/alexindigo/asynckit/master.svg?label=browser&style=flat)](https://travis-ci.org/alexindigo/asynckit)
[![Linux Build](https://img.shields.io/travis/alexindigo/asynckit/master.svg?label=linux:0.10-6.x&style=flat)](https://travis-ci.org/alexindigo/asynckit)
[![Windows Build](https://img.shields.io/appveyor/ci/alexindigo/asynckit/master.svg?label=windows:0.10-6.x&style=flat)](https://ci.appveyor.com/project/alexindigo/asynckit)

[![Coverage Status](https://img.shields.io/coveralls/alexindigo/asynckit/master.svg?label=code+coverage&style=flat)](https://coveralls.io/github/alexindigo/asynckit?branch=master)
[![Dependency Status](https://img.shields.io/david/alexindigo/asynckit.svg?style=flat)](https://david-dm.org/alexindigo/asynckit)
[![bitHound Overall Score](https://www.bithound.io/github/alexindigo/asynckit/badges/score.svg)](https://www.bithound.io/github/alexindigo/asynckit)

<!-- [![Readme](https://img.shields.io/badge/readme-tested-brightgreen.svg?style=flat)](https://www.npmjs.com/package/reamde) -->

| compression        |    size |
| :----------------- | ------: |
| asynckit.js        | 2.27 kB |
| asynckit.min.js    |   958 B |
| asynckit.min.js.gz |   491 B |


## Install

```sh
$ npm install asynckit --save
```

## Examples

### Parallel Jobs

Runs iterator over provided array in parallel. Stores output in the `result` array,
on the matching positions. In unlikely event of an error from one of the jobs,
will terminate rest of the active jobs (if abort function is provided)
and return error along with salvaged data to the main callback function.

```javascript
var parallel = require('asynckit/parallel')
  , assert   = require('assert')
  ;

var source         = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
  , expectedResult = [ 2, 2, 8, 32, 128, 64, 16, 4 ]
  , expectedTarget = [ 1, 1, 2, 4, 8, 16, 32, 64 ]
  , target         = []
  ;

parallel(source, asyncJob, function(err, result)
{
  assert.deepEqual(result, expectedResult);
  assert.deepEqual(target, expectedTarget);
});

// async job accepts one element from the array
// and a callback function
function asyncJob(item, cb)
{
  // different delays (in ms) per item
  var delay = item * 25;

  // pretend different jobs take different time to finish
  // and not in consequential order
  var timeoutId = setTimeout(function() {
    target.push(item);
    cb(null, item * 2);
  }, delay);

  // allow to cancel "leftover" jobs upon error
  // return function, invoking of which will abort this job
  return clearTimeout.bind(null, timeoutId);
}
```

## Want to Know More?

More examples can be found in [test folder](test/).

Or open an [issue](https://github.com/alexindigo/asynckit/issues) with questions and/or suggestions.

## License

AsyncKit is licensed under the MIT license.
