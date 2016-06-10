var streamify     = require('./streamify.js')
  , serialOrdered = require('../serialOrdered.js')
  ;

// API
module.exports = ReadableSerialOrdered;

/**
 * Streaming wrapper to `asynckit.serialOrdered`
 *
 * @param {array|object} list - array or object (named list) to iterate over
 * @param {function} iterator - iterator to run
 * @param {function} sortMethod - custom sort function
 * @param {function} callback - invoked when all elements processed
 * @returns {stream.Readable#}
 */
function ReadableSerialOrdered(list, iterator, sortMethod, callback)
{
  if (!(this instanceof ReadableSerialOrdered))
  {
    return new ReadableSerialOrdered(list, iterator, sortMethod, callback);
  }

  this.input = list;

  // turn on object mode
  ReadableSerialOrdered.super_.call(this, {objectMode: true});

  // allow time for proper setup
  process.nextTick(function()
  {
    serialOrdered(list, streamify.iterator.call(this, iterator), sortMethod, streamify.callback.call(this, callback));
  }.bind(this));
}
