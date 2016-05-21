var test          = require('tape').test
  , serialOrdered = require('../serialOrdered.js')
//  , defer         = require('../lib/defer.js')
  ;

test('serialOrdered: iterates over object with no sortMethod', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
    , index    = 0
    ;

  t.plan(keys.length * 2 + 2);

  // supports full value, key, callback interface
  serialOrdered(source, function(item, key, cb)
  {
    t.equal(keys[index], key, 'expect key (' + key + ') for the iteration to match incremental index (' + index + ':' + keys[index] + ')');
    t.equal(source[key], item, 'expect item of the iteration to match incremental source element with key position');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
    index++;
  },

  null, // force no sortMethod

  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to be an ordered letters object');
  });
});

test('serialOrdered: iterates over object sorted ascending', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
    , prev     = 'a'
    ;

  t.plan(keys.length * 2 + 2);

  serialOrdered(source, function(item, key, cb)
  {
    t.ok(prev <= key, 'expect key (' + key + ') not to decrease on each iteration – ascending sorting');
    t.equal(source[key], item, 'expect iteration indices to match original object positions');
    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
    prev = key;
  },

  serialOrdered.ascending, // sort ascending

  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to keep order of the original array');
  });
});

test('serialOrdered: iterates over object sorted descending', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
    , prev     = 'zzz'
    ;

  t.plan(keys.length * 2 + 2);

  serialOrdered(source, function(item, key, cb)
  {
    t.ok(prev >= key, 'expect key (' + key + ') not to increase on each iteration – descending sorting');
    t.equal(source[key], item, 'expect iteration indices to match original array positions');
    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
    prev = key;
  },

  serialOrdered.descending, // sort descending

  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to keep order of the original array');
  });
});


test('serialOrdered: iterates over object custom sorted', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
      // separate vowels from consonants
    , splitVowels = function(word)
    {
      var vowels = ['a', 'e', 'i', 'o', 'u']
        , wordVow = word.split('').map(function(x){ return vowels.indexOf(x) == -1 ? '~' : x; }).join('')
        , wordCon = word.split('').map(function(x){ return vowels.indexOf(x) == -1 ? x : '.'; }).join('')
        ;
      return [wordVow, wordCon];
    }
      // sort words based on vowels and their position
    , customSort = function(wordA, wordB)
    {
      wordA = splitVowels(wordA);
      wordB = splitVowels(wordB);
      return wordA[0] < wordB[0] ? -1 : (
        wordA[0] > wordB[0] ? 1 : (
          wordA[1] < wordB[1] ? -1 : wordA[1] > wordB[1] ? 1 : 0
        )
      );
    }
      // pre-sort list keys
    , customSortedKeys = keys.sort(customSort)
    , prev
    ;

  t.plan(keys.length * 3 + 2);

  serialOrdered(source, function(item, key, cb)
  {
    t.notEqual(customSortedKeys.indexOf(key), -1, 'expect key to be in the list');
    t.ok(customSortedKeys.indexOf(prev) < customSortedKeys.indexOf(key), 'expect key (' + prev + ' -> ' + key + ') index (' + customSortedKeys.indexOf(prev) + ' -> ' + customSortedKeys.indexOf(key) + ') to increase on each iteration');
    t.equal(source[key], item, 'expect iteration indices to match original array positions');

    setTimeout(cb.bind(null, null, String.fromCharCode(64 + item)), 10 * item);
    prev = key;
  },

  customSort, // custom sorting

  function(err, result)
  {
    t.error(err, 'expect no errors');
    t.deepEqual(result, expected, 'expect result to keep order of the original array');
  });
});

test('serialOrdered: iterates over object custom sorted over values', function(t)
{
  var source   = { first: 1, second: 2, third: 3, fourth: 4, three: 3, two: 2, one: 1 }
    , keys     = Object.keys(source)
    , values   = keys.map(function(k){ return source[k]; })
    , expected = { first: 'A', second: 'B', third: 'C', fourth: 'D', three: 'C', two: 'B', one: 'A' }
      // get smallest even number
    , prev     = Math.min.apply(Math, values.filter(function(n){ return !(n % 2); }))
      // puts even numbers first
    , evenOddSort = function(a, b)
    {
      var order = a < b ? -1 : a > b ? 1 : 0
        , aOdd  = a % 2
        , bOdd  = b % 2
        ;
      return aOdd === bOdd ? order : aOdd ? 1 : -1;
    }
    , customSort = function(keyA, keyB)
    {
      return evenOddSort(source[keyA], source[keyB]);
    }
    ;

  t.plan(keys.length * 2 + 2);

  serialOrdered(source, function(item, key, cb)
  {
    var incr  = prev <= item
      , shift = (prev % 2) !== (item % 2)
      ;

    t.ok(incr || shift, 'expect item (' + prev + ' -> ' + item + ') to increase on each iteration, unless it is switch from even to odd');
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
