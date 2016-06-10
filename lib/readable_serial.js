var streamify = require('./streamify.js')
  , serial    = require('../serial.js')
  ;

// API
module.exports = ReadableSerial;

/**
 * Streaming wrapper to `asynckit.serial`
 *
 * @param {array|object} list - array or object (named list) to iterate over
 * @param {function} iterator - iterator to run
 * @param {function} callback - invoked when all elements processed
 * @returns {stream.Readable#}
 */
function ReadableSerial(list, iterator, callback)
{
  if (!(this instanceof ReadableSerial))
  {
    return new ReadableSerial(list, iterator, callback);
  }

  this.input = list;

  // turn on object mode
  ReadableSerial.super_.call(this, {objectMode: true});

  // allow time for proper setup
  process.nextTick(function()
  {
    serial(list, streamify.iterator.call(this, iterator), streamify.callback.call(this, callback));
  }.bind(this));
}
