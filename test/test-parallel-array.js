/* eslint no-sparse-arrays: "off" */
var test     = require('tape').test
  , parallel = require('../').parallel
  , defer    = require('../lib/defer.js')
  ;

test('parallel: iterates over array', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , start    = +new Date()
    ;

  t.plan(expected.length + 3);

  parallel(source, function(item, cb)
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
});

test('parallel: handles sync array iterator asynchronously', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , isAsync  = false
    ;

  t.plan(expected.length + 3);

  defer(function(){ isAsync = true; });

  parallel(source, function(item, cb)
  {
    t.ok(source.indexOf(item) != -1, 'expect item (' + item + ') to exist in the subject array');
    cb(null, String.fromCharCode(64 + item));
  },
  function(err, result)
  {
    t.ok(isAsync, 'expect async response');
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an ordered letters array');
  });
});

test('parallel: array: longest finishes last', function(t)
{
  var source   = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , expected = [ 1, 1, 2, 4, 8, 16, 32, 64 ]
    , target   = []
    ;

  t.plan(expected.length + 3);

  // supports full value, key, callback (shortcut) interface
  parallel(source, function(item, key, cb)
  {
    setTimeout(function()
    {
      // just "hardcode" first element
      var sum = target.reduce(function(acc, num){ return acc + num; }, 0) || 1;

      t.equal(sum, item, 'expect sum (' + sum + ') to be equal current number (' + item + ')');

      target.push(item);

      cb(null, item);
    }, 25 * item);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, source, 'expect result to be same as source array');
    t.deepEqual(target, expected, 'expect target to contain ordered numbers');
  });
});

test('parallel: array: terminates early', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , salvaged = [ 1, 1, 4, , , , 8, 2 ]
    , expected = [ 1, 1, 2, 4, 8 ]
    , target   = []
    ;

  t.plan(expected.length + 3 + 1);

  parallel(source, function(item, cb)
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
    t.equal(err.item, 16, 'expect to error out on 16');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });
});

test('parallel: array: terminated early from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , salvaged = [ 1, 1, 4, , , , 8, 2 ]
    , expected = [ 1, 1, 2, 4, 8 ]
    , target   = []
    , limitNum = 15
    , terminator
    ;

  t.plan(expected.length * 2 + 3);

  setTimeout(function()
  {
    terminator();
  }, 25 * limitNum);

  terminator = parallel(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      // just "hardcode" first element
      var sum = target.reduce(function(acc, num){ return acc + num; }, 0) || 1;

      t.ok(item < limitNum, 'expect to only process numbers (' + item + ') less than ' + limitNum);
      t.equal(sum, item, 'expect sum (' + sum + ') to be equal current number (' + item + ')');

      target.push(item);
      cb(null, item);
    }, 25 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.error(err, 'expect no error response');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });
});

test('parallel: array: terminated prematurely from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , salvaged = [ ]
    , terminator
    ;

  t.plan(2);

  terminator = parallel(source, function(item, cb)
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
    t.error(err, 'expect no error response');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source array');
  });

  terminator();
});

test('parallel: array: terminated too late from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , salvaged = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , expected = [ 1, 1, 2, 4, 8, 16, 32, 64 ]
    , target   = []
    , terminator
    ;

  t.plan(expected.length + 4);

  terminator = parallel(source, function(item, cb)
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
    t.error(err, 'expect no error response');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  setTimeout(function()
  {
    terminator();
    t.ok(true, 'expect terminator function to be invoked');
  }, 25 * 64);
});

test('parallel: array: handles non terminable iterations', function(t)
{
  var source   = [ 1, 1, 4, 16, 65, 33, 8, 2 ]
    , expected = [ 1, 1, 2, 4, 8 ]
    , target   = []
    , previous = 0
    ;

  t.plan(expected.length + 2);

  parallel(source, function(item, cb)
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
    t.equal(err.item, 16, 'expect to error out on 16');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });
});

test('parallel: array: handles unclean callbacks', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 2, 4, 6, 8, 6, 4, 2 ]
    ;

  t.plan(expected.length + 2);

  parallel(source, function(item, cb)
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
});
