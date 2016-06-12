// API
module.exports = ReadableAsyncKit;

/**
 * Base constructor for all streams
 * used to hold properties/methods
 */
function ReadableAsyncKit()
{
  ReadableAsyncKit.super_.apply(this, arguments);

  // list of active jobs
  this.jobs = {};

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

  if (typeof this.terminator == 'function')
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
