// var defaultQuery = "count=10000";
define(["filesize", "mathjs", "moment", "numeral", "lodash"], function (filesize, math, moment, numeral, _) {
  return {
    formatTimestamp: function (t) {
      return moment.unix(t).format("LLL");
    },
    formatTimeSecStamp: function (t) {
      return moment.unix(t).format("YYYY-MM-DD HH:mm");
    },
    formatSize: function (bytes) {
      if (bytes === 0) {
        return "-";
      }
      return filesize(bytes);
    },

    /**
     * Convert from byte to GiB.
     * If digits is set, return a number as string in fixed-point notation
     *
     * @param {any} bytes
     * @param {number} digits
     * @returns {number | string}
     */
    toGB: function (bytes, digits) {
      digits = digits || -1;
      var inGB = parseFloat(bytes) / 1073741824;
      if (isNaN(inGB)) {
        return 0;
      }
      if (digits === -1) {
        return inGB;
      } else {
        return inGB.toFixed(digits);
      }
    },

    formatNumber: function (i) {
      return numeral(i).format("0,0");
    },

    formatDuration: function (t, unit) {
      return moment.duration(t, unit).humanize();
    },

    basename: function (s) {
      return s.split("/").pop();
    },

    extractor: function (key) {
      return function (item) {
        return item[key ? key : "id"];
      };
    },

    keyArray: function (records, key) {
      var result = {};
      _.forEach(records, function (record) {
        var keyValue = record[key ? key : "id"];
        if (keyValue && typeof keyValue != 'undefined') result[keyValue] = record;
      });
      return result;
    },

    multiKeyArray: function (records, key1, key2) {
      var result = {};

      _.forEach(records, function (record) {
        result[record[key1] + record[key2]] = record;
      });

      return result;
    },

    keyMultiArray: function (records, key) {
      var result = {};

      _.forEach(records, function (record) {
        if (!(record[key] in result)) {
          result[record[key]] = [];
        }

        result[record[key]].push(record);
      });

      return result;
    },

    dayStart: function (ts) {
      var modified = new Date(ts);

      modified.setHours(0);
      modified.setMinutes(0);
      modified.setSeconds(0);
      modified.setMilliseconds(0);

      return Math.round(modified.getTime() / 1000);
    },

    dayEnd: function (ts) {
      var modified = new Date(ts);

      modified.setHours(23);
      modified.setMinutes(59);
      modified.setSeconds(59);
      modified.setMilliseconds(999);

      return Math.round(modified.getTime() / 1000);
    },

    firstDayOfYearAndMonth: function (theDay) {
      return new Date(new Date(theDay.getFullYear(), theDay.getMonth(), 1));
    },

    lastDayOfYearAndMonth: function (theDay) {
      return new Date((new Date(theDay.getFullYear(), theDay.getMonth() + 1, 1)) - 1);
    },

    getSearchDateFilter: function (scope) {
      if (scope.rangeStart > scope.rangeEnd) {
        scope.alerts.push({
          type: 'danger',
          msg: "Date options is invalid!"
        });
        return '';
      }

      var rangeStartEpoch = this.dayStart(scope.rangeStart);
      var rangeEndEpoch = this.dayEnd(scope.rangeEnd);
      var filter = {
        filter: [
          "end.ge." + rangeStartEpoch,
          "end.lt." + rangeEndEpoch
        ]
      };
      return filter;
    },

    /**
     * Convert a nested object into an array for display.
     * This is for totals which has billing as key on one level, Organisation as key on next level
     *
     * @param {Object} nestedObj
     * @return Array
     */
    rearrange: function rearrange(nestedObj) {
      return this.deflate(nestedObj, 'billing', 'organisation');
    },

    /**
     * Convert a nested object into an array for display.
     * It only deflates two levels.
     *
     * @param {Object} aMap
     * @param {String} k1 level1 key
     * @param {String} k2 level2 key
     * @return Array
     */
    deflate: function deflate(aMap, k1, k2) {
      var flatArray = [], level1, level2;
      for (level1 in aMap) {
        for (level2 in aMap[level1]) {
          var newMap = {};
          newMap[k1] = level1;
          newMap[k2] = level2;
          angular.extend(newMap, aMap[level1][level2]);
          flatArray.push(newMap);
        }
      }
      return flatArray;
    },

    // Convert an array to a map, opposite of deflate function
    inflate: function inflate(flatArray, k1, k2) {
      var nested = {}, level1, level2;
      flatArray.forEach(function(amap) {
        if (k1 in amap) {
          level1 = amap[k1];
          delete amap[k1];
          if (!(level1 in nested)) {
            nested[level1] = {};
          }
          if (k2) {
            if (k2 in amap) {
              level2 = amap[k2];
              delete amap[k2];
            }
            nested[level1][level2] = amap;
          } else {
            nested[level1] = amap;
          }
        } else {
          console.warn('Data problem: just skipped a row because it did ' +
            'not have a "' + k1 + '" field')
        }
      });
      return nested;
    },

    /**
     * Create a string as a hash key of a search
     *
     * @param {Array} elements
     * @return String
     */
    hashSearch: function hashSearch(elements) {
      if (angular.isArray(elements)) {
        return elements.join('');
      } else {
        throw "Only array is supported for creating search hash key.";
      }
    },

    /**
     * Get result from cached search results by some simple hash key
     *
     * @param {Object} obj Container object
     * @param {Array} params Search parameters
     * @param {String} attr Key of object to be returned, optional
     * @return Object
     */
    getCached: function getCached(obj, params, attr) {
      var searchHash = this.hashSearch(params);
      if (angular.isDefined(attr)) {
        var t = {};
        if (attr in obj[searchHash]) {
          t[attr] = obj[searchHash][attr];
        }
        return t;
      } else {
        return obj[searchHash];
      }
    },

    /**
     * Remove one object from an array if the object has a key-value pair
     *
     * @param {Array} objArray Array of object
     * @param {String} propName Property name of object to look for
     * @param {String} value Value of the property to match
     * @return Object or null
     */
    spliceOne: function spliceOne(objArray, propName, value) {
      var i = 0, l = objArray.length, result;
      for (i; i < l; i++) {
        if (propName in objArray[i] && objArray[i][propName] === value) {
          result = objArray.splice(i, 1);
          break;
        }
      }
      return result && result.length == 1 ? result[0] : null;
    },

    durationWeight: function (t1, t2, timestamps) {
      if (timestamps.length == 1) {
        var soleSnapshot = [];
        soleSnapshot[timestamps[0]] = 1;
        return soleSnapshot;
      }

      var range = t2 - t1;
      var weights = {};

      weights[timestamps[0]] = (timestamps[1] - t1) / range;

      for (var i = 1; i < timestamps.length - 1; i++) {
        weights[timestamps[i]] = (timestamps[i + 1] - timestamps[i]) / range;
      }

      weights[timestamps[timestamps.length - 1]] = (t2 - timestamps[timestamps.length - 1]) / range;

      return weights;
    },

    nextPage: function (query) {
      var _query = this.clone(query);

      if ("page" in _query) {
        _query.page += 1;
      }
      // var next = [];
      // _.forEach(query, function(param) {
      //     if (_.startsWith(param, "page=")) {
      //         next.push("page=" + (parseInt(param.split("=")[1]) + 1));
      //     } else {
      //         next.push(param);
      //     }
      // });
      return _query;
    },

    clone: function (obj) {
      var copy;

      // Handle the 3 simple types, and null or undefined
      if (null == obj || "object" != typeof obj) return obj;

      // Handle Date
      if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
      }

      // Handle Array
      if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
          copy[i] = this.clone(obj[i]);
        }
        return copy;
      }

      // Handle Object
      if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
          if (obj.hasOwnProperty(attr)) copy[attr] = this.clone(obj[attr]);
        }
        return copy;
      }

      throw new Error("Unable to copy obj! Its type isn't supported.");
    },

    /**
     * Convert contract price by a denominator to a price can be used for a service:
     * either hourly or monthly depends on service
     *
     * @param {objcet} contracts keyed objects in which each should have UnitPrice element
     * @param {number} denominator a year in hours or months
     */
    convertContractPrice: function(contracts, denominator) {
      if (typeof denominator === "undefined")
        throw new Error("Missing denominator");

      Object.keys(contracts).forEach(function(id) {
        if ('unitPrice' in contracts[id]) {
          if (!('priceConverted' in contracts[id])) {
            // just convert once
            contracts[id]['priceConverted'] = true;
            contracts[id]['unitPrice'] /=  denominator;
          }
        }
        else
          throw new Error("unitPrice was not found in contract: " + JSON.stringify(contracts[id]));
      });
    },


    /**
     * Create a dictionary with fields from a given list with values of zero
     *
     * @param {Array} fields a list of string will be used as keys in the new default object
     * @return Object
     */
    createDefaults: function(fields) {
      var defaults = {};
      for (var i = 0; i < fields.length; i++) {
        defaults[fields[i]] = 0;
      }
      return defaults;
    }
  };
});
