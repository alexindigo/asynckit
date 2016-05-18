// Public API
module.exports = parallel;

/**
 * Runs iterator over provided array elements in parallel
 *
 * @param {array|object} list - array or object to iterate over
 * @param {function} iterator - iterator to run
 * @param {object} [state] - current job status
 * @param {function} callback - invoked when all elements processed
 */
function parallel(list, iterator, state, callback)
{
  var index;

  if (typeof state == 'function')
  {
    callback = state;
    state    = undefined;
  }

  if (!state)
  {
    state = {index: 0, jobs: [], results: []};
  }

  // store current index
  index = state.index;

  state.jobs[index] = iterator(list[index], function(error, output)
  {
    // don't repeat yourself
    // skip secondary callbacks
    if (!(index in state.jobs))
    {
      return;
    }

    // clean up jobs
    delete state.jobs[index];

    if (error)
    {
      // don't process rest of the results
      // stop still active jobs
      state.jobs.map(invoke);
      // and reset the list
      state.jobs = {};
      // return salvaged results
      callback(error, state.results);
      return;
    }

    state.results[index] = output;

    // looks like it's the last one
    if (Object.keys(state.jobs).length === 0)
    {
      callback(null, state.results);
      return;
    }
  });

  // prepare for the next step
  state.index++;

  // proceed to the next element
  if (state.index < list.length)
  {
    parallel(list, iterator, state, callback);
  }
}

/**
 * Invokes provided function
 *
 * @param {function} func - function to invoke
 */
function invoke(func)
{
  if (typeof func == 'function')
  {
    func();
  }
}
