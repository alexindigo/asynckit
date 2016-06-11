var initState = require('./state.js');

// API
module.exports = ReadableAsyncKit;

/**
 * Base constructor for all streams
 * used to hold properties/methods
 */
function ReadableAsyncKit()
{
  ReadableAsyncKit.super_.apply(this, arguments);

  // stream state
  this.state = initState(this.input);

  // add stream methods
  this.destroy = destroy;
  this._read   = _read;
}

/**
 * Destroys readable stream,
 * by aborting outstanding jobs
 *
 * @returns {void}
 */
function destroy()
{
  if (this.destroyed)
  {
    return;
  }

  this.destroyed = true;

  // wait for it...
  if (!this.terminator)
  {
    process.nextTick(function()
    {
      this.terminator();
    }.bind(this));
  }
  else
  {
    this.terminator();
  }
}

/**
 * Implement _read to comply with Readable streams
 * Doesn't really make sense for flowing object mode
 *
 * @private
 */
function _read()
{

}
