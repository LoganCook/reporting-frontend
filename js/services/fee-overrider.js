define(function () {
  'use strict';
  var overrides = null;
  require(["services/fee-overridings"], function (data) {
    overrides = data;
  }, function (err) {
    console.log("No fee overriding can be loaded.[" + JSON.stringify(err) + "]");
  });

  /**
   * Convert a string with year month (yyyymm) to unix timestamp
   *
   * @param {string} yearMonth
   */
  function firstDayofMonthYear(yearMonth) {
    var found = yearMonth.match(/^(\d{4})(\d{2})$/);
    if (found) {
      return Math.round(new Date(found[1], found[2] - 1, 1).getTime() / 1000);
    }
    return null;
  }

  return {
    getOverrides: function getOverrides(serviceName, startTs, endTs) {
      /**
       * Ensure a parameter is a Date object
       *
       * Purely for internal use when developing.
       *
       * @param {string} serviceName
       * @param {int} startTs
       * @param {int} endTs
       */
      if (overrides && serviceName in overrides) {
        var allDates = overrides[serviceName];
        var months = Object.keys(allDates);
        for (var i = 0; i < months.length; i++) {
          var timestamp = firstDayofMonthYear(months[i]);
          if (timestamp && timestamp >= startTs && timestamp < endTs) {
            return allDates[months[i]];
          }
        }
        return null;
      }
      return null;
    }
  };
});