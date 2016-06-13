var test           = require('tape').test
  , streamAssert   = require('./lib/stream_assert.js')
  , asynckitStream = require('../stream.js')
  , defer          = require('../lib/defer.js')
  ;

test('stream: serial: iterates over array', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , itemsSum = 16
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , start    = +new Date()
    , stream
    ;

  t.plan(expected.length * 2 + 4);

  stream = asynckitStream.serial(source, function(item, cb)
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

  streamAssert.success(t, stream, {elements: expected});
});

test('stream: serial: handles sync array iterator asynchronously', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , isAsync  = false
    , stream
    ;

  t.plan(expected.length * 2 + 4);

  defer(function(){ isAsync = true; });

  stream = asynckitStream.serial(source, function(item, cb)
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

  streamAssert.success(t, stream, {elements: expected});
});

test('stream: serial: array: longest finishes in order', function(t)
{
  var source      = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , notExpected = [ 1, 1, 2, 4, 8, 16, 32, 64 ]
    , target      = []
    , slider      = 0
    , stream
    ;

  t.plan(source.length * 2 + 5);

  // supports full value, key, callback (shortcut) interface
  stream = asynckitStream.serial(source, function(item, key, cb)
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

  streamAssert.success(t, stream, {compare: function(key, value)
  {
    t.equal(slider, key, 'expect key (' + key + ') to be in line with slider (' + slider + ')');
    t.equal(source[slider], value, 'expect value (' + value + ') to be in line with slider-index value (' + source[slider] + ')');
    slider++;
  }});
});

test('stream: serial: array: terminates early', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , expected = [ 1, 1, 4 ]
    , expError = {item: 16}
    , target   = []
    , stream
    ;

  t.plan(expected.length * 2 + 5);

  stream = asynckitStream.serial(source, function(item, cb)
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
    t.equal(err.item, expError.item, 'expect to error out on ' + expError.item);
    t.deepEqual(result, expected, 'expect result to contain processed parts that less than 10 of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.failure(t, stream, {elements: expected, error: expError});
});

test('stream: serial: array: terminated early from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , expected = [ 1, 1, 4 ]
    , target   = []
    , limitNum = 7
    , stream
    ;

  t.plan(expected.length * 2 + 4);

  setTimeout(function()
  {
    stream.destroy();
  }, 5 * (limitNum + expected.reduce(function(a, b){ return a + b; })));

  stream = asynckitStream.serial(source, function(item, cb)
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

  streamAssert.success(t, stream, {elements: expected});
});

test('stream: serial: array: terminated prematurely from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
    , expected = [ ]
    , stream
    ;

  t.plan(3);

  stream = asynckitStream.serial(source, function(item, cb)
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

  streamAssert.success(t, stream, {elements: expected});

  stream.destroy();
});

test('stream: serial: array: terminated too late from outside', function(t)
{
  var source   = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , expected = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , target   = []
    , stream
    ;

  t.plan(expected.length * 2 + 4);

  stream = asynckitStream.serial(source, function(item, cb)
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
    stream.destroy();

    t.error(err, 'expect no error response');
    t.deepEqual(result, expected, 'expect result to contain salvaged parts of the source array');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.success(t, stream, {elements: expected});
});

test('stream: serial: array: handles non terminable iterations', function(t)
{
  var source   = [ 1, 1, 4, 16, 65, 33, 8, 2 ]
    , expected = [ 1, 1, 4 ]
    , expError = {item: 16}
    , target   = []
    , previous = 0
    , stream
    ;

  t.plan(expected.length * 2 + 4);

  stream = asynckitStream.serial(source, function(item, cb)
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
    t.equal(err.item, expError.item, 'expect to error out on ' + expError.item);
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });

  streamAssert.failure(t, stream, {elements: expected, error: expError});
});

test('stream: serial: array: handles unclean callbacks', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 2, 4, 6, 8, 6, 4, 2 ]
    , stream
    ;

  t.plan(expected.length * 2 + 3);

  stream = asynckitStream.serial(source, function(item, cb)
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

  streamAssert.success(t, stream, {elements: expected});
});
