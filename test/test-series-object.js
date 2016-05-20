var test   = require('tape').test
  , series = require('../series.js')
  , defer  = require('../lib/defer.js')
  ;

test('series: iterates over object', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , itemsSum = 16
    , keys     = Object.keys(source)
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
    , start    = +new Date()
    ;

  t.plan(keys.length * 2 + 3);

  // supports full value, key, callback (shortcut) interface
  series(source, function(item, key, cb)
  {
    t.ok(keys.indexOf(key) != -1, 'expect key (' + key + ') to exist in the keys array');
    t.equal(item, source[key], 'expect item (' + item + ') to match in same key (' + key + ') element in the source object');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 100 * item);
  },
  function(err, result)
  {
    var diff = +new Date() - start;

    t.ok(diff > (itemsSum * 100), 'expect response time (' + diff + 'ms) to be more than ' + (itemsSum * 100) + ' ms');
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an ordered letters object');
  });
});

test('series: handles sync object iterator asynchronously', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
    , isAsync  = false
    ;

  t.plan(keys.length * 2 + 3);

  defer(function(){ isAsync = true; });

  // supports full value, key, callback (shortcut) interface
  series(source, function(item, key, cb)
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
});

test('series: object: longest finishes in order', function(t)
{
  var source      = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , expected    = [ 1, 1, 4, 16, 64, 32, 8, 2 ]
    , target      = []
    ;

  t.plan(3);

  // supports just value, callback (shortcut) interface
  series(source, function(item, cb)
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
    t.deepEqual(result, source, 'expect result to be same as source object');
    // expect it to be invoked in order
    // which is not always the case with objects
    // use `seriesOrdered` if order really matters
    t.deepEqual(target, expected, 'expect target to be same as source object');
  });
});

test('series: object: terminates early', function(t)
{
  var source   = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , salvaged = { first: 1, one: 1, four: 4 }
    , expected = [ 1, 1, 4 ]
    , target   = []
    ;

  t.plan(Object.keys(salvaged).length + 4 + 1);

  // supports full value, key, callback (shortcut) interface
  series(source, function(item, key, cb)
  {
    var id = setTimeout(function()
    {
      // expect it to be invoked in order
      // which is not always the case with objects
      // use `seriesOrdered` if order really matters
      t.ok(item < 5 || item == 16, 'expect only certain numbers being processed');

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
    }, 5 * item);

    return clearTimeout.bind(null, id);
  },
  function(err, result)
  {
    t.equal(err.key, 'sixteen', 'expect to error out on key `sixteen`');
    t.equal(err.item, 16, 'expect to error out on value `16`');
    t.deepEqual(result, salvaged, 'expect result to contain salvaged parts of the source object');
    t.deepEqual(target, expected, 'expect target to contain passed numbers');
  });
});

test('series: object: handles non terminable iterations', function(t)
{
  var source   = { first: 1, one: 1, four: 4, sixteen: 16, sixtyFour: 64, thirtyTwo: 32, eight: 8, two: 2 }
    , expected = [ 1, 1, 4 ]
    , target   = []
    , previous = 0
    ;

  t.plan(expected.length + 2 + 1);

  // supports just value, callback (shortcut) interface
  series(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      // expect it to be invoked in order
      // which is not always the case with objects
      // use `seriesOrdered` if order really matters
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

test('series: object: handles unclean callbacks', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 2, second: 4, third: 6, fourth: 8, three: 6, two: 4, one: 2 }
    ;

  t.plan(keys.length * 2 + 2);

  // supports full value, key, callback (shortcut) interface
  series(source, function(item, key, cb)
  {
    setTimeout(function()
    {
      t.ok(keys.indexOf(key) != -1, 'expect key (' + key + ') to exist in the keys array');
      t.equal(item, source[key], 'expect item (' + item + ') to match in same key (' + key + ') element in the source object');

      cb(null, item * 2);
      cb(null, item * -2);

    }, 5 * item);
  },
  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an multiplied by two object values');
  });
});
