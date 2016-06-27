// var defaultQuery = "count=10000";
define(["filesize", "mathjs", "moment", "numeral", "lodash"], function (filesize, math, moment, numeral, _) {
return {
    formatTimestamp: function(t) {
        return moment.unix(t).format("LLL");
    },
    formatTimeSecStamp: function(t) {
        return moment.unix(t).format("YYYY-MM-DD HH:mm");
    },
    formatSize: function(bytes) {
        if (bytes === 0) { return "-"; }
        return filesize(bytes);
    },

    formatNumber: function(i) {
        return numeral(i).format("0,0");
    },

    formatDuration: function(t, unit) {
        return moment.duration(t, unit).humanize();
    },

    basename: function(s) {
        return s.split("/").pop();
    },

    extractor: function(key) {
        return function(item) {
            return item[key ? key : "id"];
        };
    },

    keyArray: function(records, key) {
        var result = {};

        _.forEach(records, function(record) {
            result[record[key ? key : "id"]] = record;
        });

        return result;
    }, 
    multiKeyArray: function(records, key1, key2) {
        var result = {};

        _.forEach(records, function(record) {
            result[record[key1] + record[key2]] = record;
        });

        return result;
    },
    
    keyMultiArray: function(records, key) {
        var result = {};

        _.forEach(records, function(record) {
            if (!(record[key] in result)) {
                result[record[key]] = [];
            }

            result[record[key]].push(record);
        });

        return result;
    },

    dayStart: function(ts) {
        var modified = new Date(ts);

        modified.setHours(0);
        modified.setMinutes(0);
        modified.setSeconds(0);
        modified.setMilliseconds(0);

        return Math.round(modified.getTime() / 1000);
    },

    dayEnd: function(ts) {
        var modified = new Date(ts);

        modified.setHours(23);
        modified.setMinutes(59);
        modified.setSeconds(59);
        modified.setMilliseconds(999);

        return Math.round(modified.getTime() / 1000);
    },
    
    firstDayOfYearAndMonth(theDay){ 
        return new Date(new Date(theDay.getFullYear(), theDay.getMonth(), 1));
    },
    
    lastDayOfYearAndMonth(theDay){ 
        return new Date((new Date(theDay.getFullYear(), theDay.getMonth() + 1, 1)) - 1);
    },
    
    durationWeight: function(t1, t2, timestamps) {
        if (timestamps.length == 1) {
            var soleSnapshot = [];
            soleSnapshot[timestamps[0]] = 1;
            return soleSnapshot;
        }

        var range = t2 - t1;
        var weights = {};

        weights[timestamps[0]] = (timestamps[1] - t1) / range;

        for (var i = 1; i < timestamps.length - 1; i++) {
            weights[timestamps[i]] = (timestamps[i+1] - timestamps[i]) / range;
        }

        weights[timestamps[timestamps.length-1]] = (t2 - timestamps[timestamps.length - 1]) / range;

        return weights;
    },

    nextPage: function(query) {
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

    clone: function(obj) {
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
        
};
});
