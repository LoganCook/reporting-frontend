'use strict';

/**
 * Ensure a parameter is a Date object
 *
 * Purely for internal use when developing.
 *
 * @param {any} d
 */
function ensureDate(d) {
  if (!(d instanceof Date)) {
    throw new TypeError("Only Date type is acceptable");
  }
}

/**
 * Get timestamp of either the start or end of a local date
 *
 * @param {Date} d Date to be converted
 * @param {boolean} end optional, if true, return timestamp of the end of the day
 * @returns {number}
 */
function dateToTimestamp(d, end) {
  ensureDate(d);
  end = end | false;
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
}

/**
 * Check if a date is within current month
 *
 * @param {Date} d
 * @returns {boolean}
 */
function withinCurrentMonth(d) {
  ensureDate(d);
  var current = new Date();
  return current.getMonth() == d.getMonth();
}

define(function() {
  return {
    dateToTimestamp: dateToTimestamp,
    withinCurrentMonth: withinCurrentMonth
  };
});
