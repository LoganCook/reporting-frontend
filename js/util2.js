'use strict';

function dateToTimestamp(d, end) {
  end = end | false;
  // Get timestamp of a local time
  if (d instanceof Date) {
    if (end) {
      d.setHours(23);
      d.setMinutes(59);
      d.setSeconds(59);
    } else {
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
    }
    return parseInt(d.getTime() / 1000, 10);
  } else {
    throw new TypeError("Only Date type is acceptable");
  }
}

define(function() {
  return {
    dateToTimestamp: dateToTimestamp
  };
});
