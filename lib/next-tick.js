module.exports = nextTick;

/**
 * Runs provided function on next iteration of the event loop
 *
 * @param {function} fn - function to run
 */
function nextTick(fn)
{
  var setNextTick = typeof setImmediate == 'function'
    ? setImmediate
    : (
      typeof process == 'object' && typeof process.nextTick == 'function'
      ? process.nextTick
      : null
    );

  if (setNextTick)
  {
    setNextTick(fn);
  }
  else
  {
    setTimeout(fn, 0);
  }
}
