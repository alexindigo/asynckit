var test          = require('tape').test
  , serialOrdered = require('../serialOrdered.js')
//  , defer         = require('../lib/defer.js')
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

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
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
  var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
    , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
      // get smallest even number
    , prev     = Math.min.apply(Math, source.filter(function(n){ return !(n % 2); }))
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

//
//
// test('serial: handles sync array iterator asynchronously', function(t)
// {
//   var source   = [ 1, 2, 3, 4, 3, 2, 1 ]
//     , expected = [ 'A', 'B', 'C', 'D', 'C', 'B', 'A' ]
//     , isAsync  = false
//     ;
//
//   t.plan(expected.length + 3);
//
//   defer(function(){ isAsync = true; });
//
//   serial(source, function(item, cb)
//   {
//     t.ok(source.indexOf(item) != -1, 'expect item (' + item + ') to exist in the subject array');
//     cb(null, String.fromCharCode(64 + item));
//   },
//   function(err, result)
//   {
//     t.ok(isAsync, 'expect async response');
//     t.error(err, 'expect no errors');
//     t.deepEqual(result, expected, 'expect result to be an ordered letters array');
//   });
// });
//
// test('serial: array: terminates early', function(t)
// {
//   var source   = [ 1, 1, 4, 16, 66, 34, 8, 2 ]
//     , expected = [ 1, 1, 4 ]
//     , target   = []
//     ;
//
//   t.plan(expected.length + 3 + 1);
//
//   serial(source, function(item, cb)
//   {
//     var id = setTimeout(function()
//     {
//       t.ok(item < 5 || item == 16, 'expect only certain numbers being processed');
//
//       if (item < 10)
//       {
//         target.push(item);
//         cb(null, item);
//       }
//       // return error on big numbers
//       else
//       {
//         cb({item: item});
//       }
//     }, 5 * item);
//
//     return clearTimeout.bind(null, id);
//   },
//   function(err, result)
//   {
//     t.equal(err.item, 16, 'expect to error out on 16');
//     t.deepEqual(result, expected, 'expect result to contain processed parts that less than 10 of the source array');
//     t.deepEqual(target, expected, 'expect target to contain passed numbers');
//   });
// });
