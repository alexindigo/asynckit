var initState     = require('./state.js')
  , destroyMarker = require('./stream_destroyed_marker.js')
  ;

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
  var nextJob;

  if (!this.state)
  {
    return;
  }

  nextJob = this.state.jobs[Object.keys(this.state.jobs)[0]];
  // clean up local state
  this.state = null;

  if (nextJob)
  {
    // abort outstanding job
    if (typeof nextJob.aborter == 'function')
    {
      nextJob.aborter();
    }

    // assume callback is always here
    nextJob.callback(destroyMarker);
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
