/* eslint no-console: "off" */

var asynckit = require('./')
  , async    = require('async')
  , assert   = require('assert')
  , expected = 0
  ;

var Benchmark = require('benchmark');
var suite = new Benchmark.Suite;

var source = [];
for (var z = 1; z < 1000; z++)
{
  source.push(z);
  expected += z;
}


suite
// add tests

.add('async.map', function(deferred)
{
  var A = 0;
  async.map(source, function(i, cb)
  {
    A += i;
    async.setImmediate(function () { cb(null, A); });
  }, function(err, res)
  {
    assert.ifError(err);
    assert.equal(res[res.length - 1], expected);
    deferred.resolve();
  });
}, {'defer': true})

.add('asynckit.parallel', function(deferred)
{
  var B = 0;
  asynckit.parallel(source, function(i, cb)
  {
    B += i;
    cb(null, B);
  }, function(err, res)
  {
    assert.ifError(err);
    assert.equal(res[res.length - 1], expected);
    deferred.resolve();
  });
}, {'defer': true})

.add('async.mapSeries', function(deferred)
{
  var C = 0;
  async.mapSeries(source, function(i, cb)
  {
    C += i;
    async.setImmediate(function () { cb(null, C); });
  }, function(err, res)
  {
    assert.ifError(err);
    assert.equal(res[res.length - 1], expected);
    deferred.resolve();
  });
}, {'defer': true})


// add listeners
.on('cycle', function(ev)
{
  console.log(String(ev.target));
})
.on('complete', function()
{
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': true });
