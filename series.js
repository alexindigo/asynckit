var iterate   = require('./lib/iterate.js')
  , initState = require('./lib/state.js')
  ;

// Public API
module.exports = series;

/**
 * Runs iterator over provided array elements in series
 *
 * @param {array|object} list - array or object (named list) to iterate over
 * @param {function} iterator - iterator to run
 * @param {function} callback - invoked when all elements processed
 */
function series(list, iterator, callback)
{
  var state = initState(list);

  iterate(list, iterator, state, function iteratorHandler(error, result)
  {
    if (error)
    {
      callback(error, result);
      return;
    }

    state.index++;

    // are we there yet?
    if (state.index < (state['namedList'] || list).length)
    {
      iterate(list, iterator, state, iteratorHandler);
      return;
    }

    // done here
    callback(null, state.results);
  });
}
