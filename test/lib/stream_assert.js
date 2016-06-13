var util     = require('util')
  , Writable = require('stream').Writable
  ;

// API
module.exports =
{
  success: streamSuccessfulAssert,
  failure: streamFailedAssert
};

util.inherits(Receiver, Writable);

/**
 * Tests provided successful readable stream
 *
 * @param {object} test - test suite object
 * @param {stream.Readable#} stream - readable stream to test
 * @param {mixed} fixture - fixture to check against
 */
function streamSuccessfulAssert(test, stream, fixture)
{
  var receiver = new Receiver(test, fixture);
  stream.pipe(receiver);
}

/**
 * Tests provided failed readable stream
 *
 * @param {object} test - test suite object
 * @param {stream.Readable#} stream - readable stream to test
 * @param {mixed} fixture - fixture to check against
 */
function streamFailedAssert(test, stream, fixture)
{
  var receiver = new Receiver(test, fixture);
  stream.pipe(receiver);

  stream.on('error', function(error)
  {
    if (fixture.error)
    {
      test.deepEqual(error, fixture.error, '+ expect error object to match ' + JSON.stringify(fixture.error));
    }
    else
    {
      test.fail(error);
    }
  });
}

/**
 * Receiver stream constructor
 *
 * @param {object} test - test suite object
 * @param {mixed} fixture - fixture to check against
 */
function Receiver(test, fixture)
{
  this.test    = test;
  this.fixture = fixture;

  // turn on object mode
  Writable.call(this, {objectMode: true});

  this.on('finish', function()
  {
    if (fixture.error)
    {
      test.fail('+ do not expect stream to have normal ending');
    }
    else
    {
      test.ok(true, '+ stream finished successfully.');
    }
  });

}

/**
 * Receiver for the written data (underlying writeable stream interface)
 *
 * @private
 * @param {mixed} element - bundle metadata
 * @param {string} encoding - encoding type for a chunk,
 *                          ignored since expecting only objects
 * @param {function} next - callback function
 */
Receiver.prototype._write = function(element, encoding, next)
{
  if (typeof this.fixture.compare == 'function')
  {
    this.fixture.compare(element.key, element.value);
  }
  else
  {
    this.test.equal(this.fixture.elements[element.key], element.value, '+ expect element (' + element.value + ') to equal fixture.elements[' + element.key +  '] (' + this.fixture.elements[element.key] + ') of ' + JSON.stringify(this.fixture.elements));
  }
  next();
};
