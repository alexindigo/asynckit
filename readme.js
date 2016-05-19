// TODO: Need to fix reamde first
// make it parse markdown properly

var fs       = require('fs')
  , path     = require('path')
  , test     = require('tape')
  , reamde   = require('reamde')
  , asynckit = require('../')
  , parallel = require('../parallel.js')
  , content  = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf-8')
  , examples
  ;

examples = reamde(content, {
  runtime:
  [
    'callback'
  ],
  replace:
  {
    'require(\'asynckit\')'          : asynckit,
    'require(\'asynckit/parallel\')' : parallel,
    'assert.deepEqual('              : 'callback('
  }
});

// Run tests
test('readme', function(t)
{
  t.plan(5);

  examples.forEach(function(ex)
  {
    ex(function(actual, expected)
    {
      t.deepEqual(actual, expected, 'expecting readme examples to match: ' + actual + ' vs ' + expected + '.');
    });
  });
});
