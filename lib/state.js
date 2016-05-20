// API
module.exports = state;

/**
 * Creates initial state object
 * for iteration over list
 *
 * @param   {array|object} list - list to iterate over
 * @returns {object} - initial state object
 */
function state(list)
{
  var isNamedList = !Array.isArray(list)
    , initState =
    {
      index    : 0,
      namedList: isNamedList ? Object.keys(list) : null,
      jobs     : {},
      results  : isNamedList ? {} : []
    }
    ;

  return initState;
}
