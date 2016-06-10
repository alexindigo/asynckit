var tape     = require('tape')
  , _end     = tape.Test.prototype._end
  , run      = tape.Test.prototype.run
  , nextTick = process.nextTick
  ;

// hook into tape to clean up stuff we don't need in the browser
tape.Test.prototype.run = function()
{
  // don't break streams
  if (!this.name.match(/^stream: /))
  {
    process.nextTick = undefined;
  }
  return run.apply(this, arguments);
};

// restore things
tape.Test.prototype._end = function()
{
  process.nextTick = nextTick;
  return _end.apply(this, arguments);
};
