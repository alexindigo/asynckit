/* eslint no-sparse-arrays: "off" */
var test          = require('tape').test
  , serialOrdered = require('../').serialOrdered
  ;

test('serialOrdered: iterates over array with no sortMethod', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , index    = 0
    ;

  t.plan(expected.length * 2 + 2);

  serialOrdered(source, function(item, key, cb)
  {
    t.equal(index, key, 'expect key (' + key + ') for the iteration to match incremental index (' + index + ')');
    t.equal(source[index], item, 'expect item of the iteration to match incremental source element with index position');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
    index++;
  },

  null, // force no sortMethod

  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an ordered letters array');
  });
});

test('serialOrdered: iterates over array sorted ascending', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , prev     = Math.min.apply(Math, source)
    ;

  t.plan(expected.length * 2 + 2);

  serialOrdered(source, function(item, key, cb)
  {
    t.ok(prev <= item, 'expect item not to decrease on each iteration – ascending sorting');
    t.equal(source[key], item, 'expect iteration indices to match original array positions');

    cb(null, String.fromCharCode(64 + item));
    // this should happen before next invocation of the iterator
    prev = item;
  },

  serialOrdered.ascending, // sort ascending

  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to keep order of the original array');
  });
});

test('serialOrdered: iterates over array sorted descending', function(t)
{
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
    , prev     = Math.max.apply(Math, source)
    ;

  t.plan(expected.length * 2 + 2);

  serialOrdered(source, function(item, key, cb)
  {
    t.ok(prev >= item, 'expect item not to increase on each iteration – descending sorting');
    t.equal(source[key], item, 'expect iteration indices to match original array positions');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
    prev = item;
  },

  serialOrdered.descending, // sort descending

  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to keep order of the original array');
  });
});

test('serialOrdered: iterates over array custom sorted', function(t)
{
  var source     = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected   = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
      // get smallest even number
    , prev       = Math.min.apply(Math, source.filter(function(n){ return !(n % 2); }))
      // puts even numbers first
    , customSort = function(a, b)
    {
      var order = a < b ? -1 : a > b ? 1 : 0
        , aOdd  = a % 2
        , bOdd  = b % 2
        ;
      return aOdd === bOdd ? order : aOdd ? 1 : -1;
    }
    ;

  t.plan(expected.length * 2 + 2);

  serialOrdered(source, function(item, key, cb)
  {
    var incr  = prev <= item
      , shift = (prev % 2) !== (item % 2)
      ;

    t.ok(incr || shift, 'expect item (' + item + ') to increase on each iteration, unless it is switch from even to odd');
    t.equal(source[key], item, 'expect iteration indices to match original array positions');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
    prev = item;
  },

  customSort, // custom sorting

  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to keep order of the original array');
  });
});

test('serialOrdered: array: terminates early with custom sorting', function(t)
{
  var source         = [ 1, 1, 4, 5, 16, 66, 34, 9, 8, 2 ]
      // even numbers below 10
    , expectedResult = [ , , 4, , , , , , 8, 2 ]
      // ascending even numbers below 10
      // and 16 as next even number 16
    , expectedTarget = [ 2, 4, 8, 16 ]
      // puts even numbers first
    , customSort     = function(a, b)
    {
      var order = a < b ? -1 : a > b ? 1 : 0
        , aOdd  = a % 2
        , bOdd  = b % 2
        ;
      return aOdd === bOdd ? order : aOdd ? 1 : -1;
    }
    , target   = []
    ;

  t.plan(expectedTarget.length + 3);

  serialOrdered(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.ok((item < 10 && item % 2 === 0) || item == 16, 'expect only certain (even) numbers being processed');

      target.push(item);

      if (item < 10)
      {
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

  customSort, // custom sort

  function(err, result)
  {
    t.equal(err.item, 16, 'expect to error out on 16');
    t.deepEqual(result, expectedResult, 'expect result to contain processed parts that less than 10 of the source array');
    t.deepEqual(target, expectedTarget, 'expect target to contain passed numbers');
  });
});

test('serialOrdered: array: terminated early from outside, with custom sorting', function(t)
{
  var source         = [ 1, 1, 4, 5, 16, 66, 34, 9, 8, 2 ]
      // even numbers below 10
    , expectedResult = [ , , 4, , , , , , 8, 2 ]
      // ascending even numbers below 10
    , expectedTarget = [ 2, 4, 8 ]
      // puts even numbers first
    , customSort     = function(a, b)
    {
      var order = a < b ? -1 : a > b ? 1 : 0
        , aOdd  = a % 2
        , bOdd  = b % 2
        ;
      return aOdd === bOdd ? order : aOdd ? 1 : -1;
    }
    , target   = []
    , limitNum = 10
    , terminator
    ;

  t.plan(expectedTarget.length + 3);

  setTimeout(function()
  {
    terminator();
  }, 5 * (limitNum + expectedTarget.reduce(function(a, b){ return a + b; })));

  terminator = serialOrdered(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.ok((item < limitNum && item % 2 === 0), 'expect only even numbers (' + item + ') less than (' + limitNum + ') being processed');

      target.push(item);
      cb(null, item);
    }, 5 * item);

    return clearTimeout.bind(null, id);
  },

  customSort, // custom sort

  function(err, result)
  {
    t.error(err, 'expect no error response');
    t.deepEqual(result, expectedResult, 'expect result to contain processed parts that less than ' + limitNum + ' of the source array');
    t.deepEqual(target, expectedTarget, 'expect target to contain passed numbers');
  });
});

test('serialOrdered: array: terminated prematurely from outside, with custom sorting', function(t)
{
  var source     = [ 1, 1, 4, 5, 16, 66, 34, 9, 8, 2 ]
    , expected   = [ ]
      // puts even numbers first
    , customSort = function(a, b)
    {
      var order = a < b ? -1 : a > b ? 1 : 0
        , aOdd  = a % 2
        , bOdd  = b % 2
        ;
      return aOdd === bOdd ? order : aOdd ? 1 : -1;
    }
    , terminator
    ;

  t.plan(2);

  terminator = serialOrdered(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.fail('do not expect it to come that far');
      cb(null, item);
    }, 5 * item);

    return clearTimeout.bind(null, id);
  },

  customSort, // custom sort

  function(err, result)
  {
    t.error(err, 'expect no error response');
    t.deepEqual(result, expected, 'expect result to contain salvaged parts of the source array');
  });

  terminator();
});

test('serialOrdered: array: terminated too late from outside, with custom sorting', function(t)
{
  var source         = [ 1, 1, 4, 5, 16, 66, 34, 9, 8, 2 ]
    , expectedResult = [ 1, 1, 4, 5, 16, 66, 34, 9, 8, 2 ]
    , expectedTarget = [ 2, 4, 8, 16, 34, 66, 1, 1, 5, 9 ]
      // puts even numbers first
    , customSort     = function(a, b)
    {
      var order = a < b ? -1 : a > b ? 1 : 0
        , aOdd  = a % 2
        , bOdd  = b % 2
        ;
      return aOdd === bOdd ? order : aOdd ? 1 : -1;
    }
    , target   = []
    , terminator
    ;

  t.plan(expectedTarget.length + 3);

  terminator = serialOrdered(source, function(item, cb)
  {
    var id = setTimeout(function()
    {
      t.ok(source.indexOf(item) != -1, 'expect item (' + item + ') to exist in the subject array');

      target.push(item);
      cb(null, item);
    }, 5 * item);

    return clearTimeout.bind(null, id);
  },

  customSort, // custom sort

  function(err, result)
  {
    // terminate it after it's done
    terminator();

    t.error(err, 'expect no error response');
    t.deepEqual(result, expectedResult, 'expect result to contain processed parts of the source array');
    t.deepEqual(target, expectedTarget, 'expect target to contain passed numbers');
  });
});
