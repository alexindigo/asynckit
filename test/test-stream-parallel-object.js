/* eslint no-sparse-arrays: "off" */
var test           = require('tape').test
  , defer          = require('../lib/defer.js')
  , streamAssert   = require('./lib/stream_assert.js')
  , asynckitStream = require('../stream.js')
  ;

test('stream: parallel: iterates over object', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
    , start    = +new Date()
    , stream
    ;

  t.plan(keys.length * 3 + 4);

  // supports full value, key, callback (shortcut) interface
  stream = asynckitStream.parallel(source, function(item, key, cb)
  {
    t.ok(keys.indexOf(key) != -1, 'expect key (' + key + ') to exist in the keys array');
    t.equal(item, source[key], 'expect item (' + item + ') to match in same key (' + key + ') element in the source object');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
  },
  function(err, result)
  {
    var diff = +new Date() - start;

    t.ok(diff < 160, 'expect response time (' + diff + 'ms) to be less than sum of delays');
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an ordered letters object');
  });

  streamAssert.success(t, stream, {elements: expected});
});

test('stream: parallel: handles sync object iterator asynchronously', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
    , isAsync  = false
    , stream
    ;

  t.plan(keys.length * 3 + 4);

  defer(function(){ isAsync = true; });

  // supports full value, key, callback (shortcut) interface
  stream = asynckitStream.parallel(source, function(item, key, cb)
  {
    t.ok(keys.indexOf(key) != -1, 'expect key (' + key + ') to exist in the keys array');
    t.equal(item, source[key], 'expect item (' + item + ') to match in same key (' + key + ') element in the source object');

    cb(null, String.fromCharCode(64 + item));
  },
  function(err, result)
  {
    t.ok(isAsync, 'expect async response');
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an ordered letters object');
  });

  streamAssert.success(t, stream, {elements: expected});
});

test('stream: parallel: object: longest finishes last', function(t)
{
  var source   = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , keys     = Object.keys(source)
    , expected = [ 1, 1, 2, 4, 8, 16, 32, 64 ]
    , testbody = expected.concat()
    , target   = []
    , stream
    ;

  t.plan(keys.length * 2 + 4);

  // supports just value, callback (shortcut) interface
  stream = asynckitStream.parallel(source, function(item, cb)
  {
    setTimeout(function()
    {
      // just "hardcode" first element
      var sum = target.reduce(function(acc, num){ return acc + num; }, 0) || 1;

      t.equal(sum, item, 'expect sum (' + sum + ') to be equal current number (' + item + ')');

      target.push(item);

      cb(null, item);
    }, 10 * item);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, source, 'expect result to be same as source object');
    t.deepEqual(target, expected, 'expect target to contain ordered numbers');
  });

  // expect values "arrive" in the specific order
  streamAssert.success(t, stream, {compare: function(key, value)
  {
    var lineup = JSON.stringify(testbody)
      , slider = testbody.shift()
      ;

    t.equal(value, slider, 'expect (' + value + ') to be first in line in ' + lineup);
  }});
});

test('stream: parallel: object: terminates early', function(t)
{
  var source   = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , salvaged = { first: 1, one: 1, two: 2, four: 4, eight: 8}
    , expected = [ 1, 1, 2, 4, 8 ]
    , expError = {key: 'sixteen', item: 16}
    , target   = []
    , stream
    ;

  t.plan(Object.keys(salvaged).length * 2 + 6);

  // supports full value, key, callback (shortcut) interface
  stream = asynckitStream.parallel(source, function(item, key, cb)
  {
    var id = setTimeout(function()
    {
      // just "hardcode" first element
      var sum = target.reduce(function(acc, num){ return acc + num; }, 0) || 1;

      t.equal(sum, item, 'expect sum (' + sum + ') to be equal current item (' + key + ':' + item + ')');

      if (item < 10)
      {
        target.push(item);
        cb(null, item);
      }
      // return error on big numbers
      else
      {
        cb({key: key, item: item});
      }
    }, 10 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.equal(err.key, 'sixteen', 'expect to error out on key `sixteen`');
    t.equal(err.item, expError.item, 'expect to error out on value `16`');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source object');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.failure(t, stream, {elements: salvaged, error: expError});
});

test('stream: parallel: object: destroyed cleanly', function(t)
{
  var source   = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , salvaged = { first: 1, one: 1, two: 2, four: 4, eight: 8}
    , expected = [ 1, 1, 2, 4, 8 ]
    , limitNum = 15
    , target   = []
    , stream
    ;

  t.plan(expected.length * 3 + 4);

  // destroy stream before element 16 is processed
  setTimeout(function()
  {
    stream.destroy();
  }, 25 * limitNum);

  // do it couple times to make sure
  setTimeout(function()
  {
    stream.destroy();
  }, 25 * (limitNum + 1));

  stream = asynckitStream.parallel(source, function(item, key, cb)
  {
    var id = setTimeout(function()
    {
      // just "hardcode" first element
      var sum = target.reduce(function(acc, num){ return acc + num; }, 0) || 1;

      t.ok(item < limitNum, 'expect only numbers (' + item + ') less than ' + limitNum + ' to be processed.');
      t.equal(sum, item, 'expect sum (' + sum + ') to be equal current item (' + key + ':' + item + ')');

      target.push(item);
      cb(null, item);
    }, 25 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source object');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.success(t, stream, {elements: salvaged});
});

test('stream: parallel: object: destroyed cleanly at start', function(t)
{
  var source   = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , expected = { }
    , stream
    ;

  t.plan(3);

  stream = asynckitStream.parallel(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.fail('do not expect it to come that far');
      cb(null, item);
    }, 25 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to contain salvaged parts of the source object');
  });

  streamAssert.success(t, stream, {elements: expected});

  // destroy stream before element 16 is processed
  stream.destroy();
});

test('stream: parallel: object: destroyed after finish', function(t)
{
  var source   = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , salvaged = { first: 1, one: 1, two: 2, four: 4, eight: 8, sixteen: 16, thirtyTwo: 32, sixtyFour: 64 }
    , expected = [ 1, 1, 2, 4, 8, 16, 32, 64 ]
    , target   = []
    , stream
    ;

  t.plan(expected.length * 2 + 4);

  stream = asynckitStream.parallel(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      // just "hardcode" first element
      var sum = target.reduce(function(acc, num){ return acc + num; }, 0) || 1;

      t.equal(sum, item, 'expect sum (' + sum + ') to be equal current number (' + item + ')');

      target.push(item);
      cb(null, item);
    }, 25 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    stream.destroy();

    t.error(err, 'expect no errors');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source object');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.success(t, stream, {elements: salvaged});
});

test('stream: parallel: object: handles non terminable iterations', function(t)
{
  var source   = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , salvaged = { first: 1, one: 1, two: 2, four: 4, eight: 8}
    , expected = [ 1, 1, 2, 4, 8 ]
    , expError = {item: 16}
    , target   = []
    , previous = 0
    , stream
    ;

  t.plan(expected.length * 2 + 3);

  // supports just value, callback (shortcut) interface
  stream = asynckitStream.parallel(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      if (item < 10)
      {
        // expect it to be invoked in order
        t.ok(item >= previous, 'expect item (' + item + ') to be equal or greater than previous item (' +  previous + ')');
        previous = item;

        target.push(item);
        cb(null, item);
      }
      // return error on big numbers
      else
      {
        cb({item: item});
      }
    }, 10 * item);

    return (item % 2) ? null : clearTimeout.bind(null, id);
  },
  function(err)
  {
    t.equal(err.item, expError.item, 'expect to error out on 16');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.failure(t, stream, {elements: salvaged, error: expError});
});

test('stream: parallel: object: handles unclean callbacks', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 2, second: 4, third: 6, fourth: 8, three: 6, two: 4, one: 2 }
    , stream
    ;

  t.plan(keys.length * 3 + 3);

  // supports full value, key, callback (shortcut) interface
  stream = asynckitStream.parallel(source, function(item, key, cb)
  {
    setTimeout(function()
    {
      t.ok(keys.indexOf(key) != -1, 'expect key (' + key + ') to exist in the keys array');
      t.equal(item, source[key], 'expect item (' + item + ') to match in same key (' + key + ') element in the source object');

      cb(null, item * 2);
      cb(null, item * -2);

    }, 10 * item);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an multiplied by two object values');
  });

  streamAssert.success(t, stream, {elements: expected});
});
