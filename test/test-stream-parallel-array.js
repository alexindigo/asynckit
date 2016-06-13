/* eslint no-sparse-arrays: "off" */
var test           = require('tape').test
  , streamAssert   = require('./lib/stream_assert.js')
  , asynckitStream = require('../stream.js')
  ;

test('stream: parallel: iterates over array', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , start    = +new Date()
    , stream
    ;

  t.plan(expected.length * 2 + 4);

  stream = asynckitStream.parallel(source, function(item, cb)
  {
    t.ok(source.indexOf(item) != -1, 'expect item (' + item + ') to exist in the subject array');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
  },
  function(err, result)
  {
    var diff = +new Date() - start;

    t.ok(diff < 160, 'expect response time (' + diff + 'ms) to be less than sum of delays');
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an ordered letters array');
  });

  streamAssert.success(t, stream, {elements: expected});
});

test('stream: parallel: array: terminates early', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , salvaged = [ 1, 1, 4, , , , 8, 2 ]
    , expected = [ 1, 1, 2, 4, 8 ]
    , expError = {item: 16}
    , target   = []
    , stream
    ;

  t.plan(expected.length * 2 + 5);

  stream = asynckitStream.parallel(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      // just "hardcode" first element
      var sum = target.reduce(function(acc, num){ return acc + num; }, 0) || 1;

      t.equal(sum, item, 'expect sum (' + sum + ') to be equal current number (' + item + ')');

      if (item < 10)
      {
        target.push(item);
        cb(null, item);
      }
      // return error on big numbers
      else
      {
        cb({item: item});
      }
    }, 25 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.equal(err.item, expError.item, 'expect to error out on 16');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.failure(t, stream, {elements: salvaged, error: expError});
});

test('stream: parallel: array: handles non terminable iterations', function(t)
{
  var source   = [ 1, 1, 4, 16, 65, 33, 8, 2 ]
    , salvaged = [ 1, 1, 4, , , , 8, 2 ]
    , expected = [ 1, 1, 2, 4, 8 ]
    , expError = {item: 16}
    , target   = []
    , previous = 0
    , stream
    ;

  t.plan(expected.length * 2 + 3);

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
    }, 25 * item);

    return (item % 2) ? null : clearTimeout.bind(null, id);
  },
  function(err)
  {
    t.equal(err.item, expError.item, 'expect to error out on 16');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.failure(t, stream, {elements: salvaged, error: expError});
});

test('stream: parallel: array: handles unclean callbacks', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 2, 4, 6, 8, 6, 4, 2 ]
    , stream
    ;

  t.plan(expected.length * 2 + 3);

  stream = asynckitStream.parallel(source, function(item, cb)
  {
    setTimeout(function()
    {
      t.ok(source.indexOf(item) != -1, 'expect item (' + item + ') to exist in the source array');

      cb(null, item * 2);
      cb(null, item * -2);

    }, 50 * item);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an multiplied by two array');
  });

  streamAssert.success(t, stream, {elements: expected});
});

test('stream: parallel: array: destroyed cleanly', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , salvaged = [ 1, 1, 4, , , , 8, 2 ]
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

  stream = asynckitStream.parallel(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      // just "hardcode" first element
      var sum = target.reduce(function(acc, num){ return acc + num; }, 0) || 1;

      t.ok(item < limitNum, 'expect only numbers (' + item + ') less than ' + limitNum + ' to be processed.');
      t.equal(sum, item, 'expect sum (' + sum + ') to be equal current number (' + item + ')');

      target.push(item);
      cb(null, item);
    }, 25 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.success(t, stream, {elements: salvaged});
});

test('stream: parallel: array: destroyed cleanly at start', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , expected = [ ]
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
    t.deepEqual(result, expected, 'expect result to contain salvaged parts of the source array');
  });

  streamAssert.success(t, stream, {elements: expected});

  // destroy stream before element 16 is processed
  stream.destroy();
});

test('stream: parallel: array: destroyed after finish', function(t)
{
  var source   = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , salvaged = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
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
    stream.destroy(); // do it couple times to make sure

    t.error(err, 'expect no errors');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.success(t, stream, {elements: salvaged});
});
