var test   = require('tape').test
  , serial = require('../').serial
  , defer  = require('../lib/defer.js')
  ;

test('serial: iterates over array', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , itemsSum = 16
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , start    = +new Date()
    ;

  t.plan(expected.length + 3);

  serial(source, function(item, cb)
  {
    t.ok(source.indexOf(item) != -1, 'expect item (' + item + ') to exist in the subject array (' + source + ')');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
  },
  function(err, result)
  {
    var diff = +new Date() - start;

    t.ok(diff > (itemsSum * 10), 'expect response time (' + diff + 'ms) to be more than ' + (itemsSum * 10) + ' ms');
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an ordered letters array');
  });
});

test('serial: handles sync array iterator asynchronously', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , isAsync  = false
    ;

  t.plan(expected.length + 3);

  defer(function(){ isAsync = true; });

  serial(source, function(item, cb)
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

test('serial: array: longest finishes in order', function(t)
{
  var source      = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , notExpected = [ 1, 1, 2, 4, 8, 16, 32, 64 ]
    , target      = []
    ;

  t.plan(4);

  // supports full value, key, callback (shortcut) interface
  serial(source, function(item, key, cb)
  {
    setTimeout(function()
    {
      target.push(item);
      cb(null, item);
    }, 5 * item);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, source, 'expect result to be same as source array');
    t.deepEqual(target, source, 'expect target to be same as source array');
    t.notDeepEqual(target, notExpected, 'do not expect target to contain ordered numbers');
  });
});

test('serial: array: terminates early', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , expected = [ 1, 1, 4 ]
    , target   = []
    ;

  t.plan(expected.length + 3 + 1);

  serial(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.ok(item < 5 || item == 16, 'expect only certain numbers being processed');

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
    }, 5 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.equal(err.item, 16, 'expect to error out on 16');
    t.deepEqual(result, expected, 'expect result to contain processed parts that less than 10 of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });
});

test('serial: array: terminated early from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , expected = [ 1, 1, 4 ]
    , target   = []
    , limitNum = 7
    , terminator
    ;

  t.plan(expected.length + 3);

  setTimeout(function()
  {
    terminator();
  }, 5 * (limitNum + expected.reduce(function(a, b){ return a + b; })));

  terminator = serial(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.ok(item < limitNum, 'expect only numbers (' + item + ') less than (' + limitNum + ') being processed');

      target.push(item);
      cb(null, item);
    }, 5 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.error(err, 'expect no error response');
    t.deepEqual(result, expected, 'expect result to contain processed parts that less than ' + limitNum + ' of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });
});

test('serial: array: terminated prematurely from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , expected = [ ]
    , terminator
    ;

  t.plan(2);

  terminator = serial(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.fail('do not expect it to come that far');
      cb(null, item);
    }, 5 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.error(err, 'expect no error response');
    t.deepEqual(result, expected, 'expect result to contain salvaged parts of the source array');
  });

  terminator();
});

test('serial: array: terminated too late from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , expected = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , target   = []
    , terminator
    ;

  t.plan(expected.length + 3);

  terminator = serial(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.ok(source.indexOf(item) != -1, 'expect item (' + item + ') to exist in the subject array');

      target.push(item);
      cb(null, item);
    }, 5 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    // terminate it after it's done
    terminator();

    t.error(err, 'expect no error response');
    t.deepEqual(result, expected, 'expect result to contain salvaged parts of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });
});

test('serial: array: handles non terminable iterations', function(t)
{
  var source   = [ 1, 1, 4, 16, 65, 33, 8, 2 ]
    , expected = [ 1, 1, 4 ]
    , target   = []
    , previous = 0
    ;

  t.plan(expected.length + 2 + 1);

  serial(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      // expect it to be invoked in order
      t.ok(item >= previous, 'expect item (' + item + ') to be equal or greater than previous item (' +  previous + ')');
      previous = item;

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
    }, 5 * item);

    return (item % 2) ? null : clearTimeout.bind(null, id);
  },
  function(err)
  {
    t.equal(err.item, 16, 'expect to error out on 16');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });
});

test('serial: array: handles unclean callbacks', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 2, 4, 6, 8, 6, 4, 2 ]
    ;

  t.plan(expected.length + 2);

  serial(source, function(item, cb)
  {
    setTimeout(function()
    {
      t.ok(source.indexOf(item) != -1, 'expect item (' + item + ') to exist in the source array');

      cb(null, item * 2);
      cb(null, item * -2);

    }, 5 * item);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an multiplied by two array');
  });
});
