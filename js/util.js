var filesize = require("filesize");
var math = require("mathjs");
var moment = require("moment");
var numeral = require("numeral");
var _ = require("lodash");

var defaultQuery = "count=10000";

module.exports = {
    formatTimestamp: function(t) {
        return moment.unix(t).format("LLL");
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

    api: function(name) {
        return function(parameters) {
            var query = parameters ? parameters.join("&") : defaultQuery;

            if (query.length < 1024) {
                return this.get(this.base + name + "?" + query);
            } else {
                var headers = {};

                _.merge(headers, this.defaults.headers, {
                    "Content-Type": "application/x-www-form-urlencoded"
                });

                return this.post(this.base + name, {
                    data: query,
                    headers: headers
                });
            }
        };
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
        var next = [];
        _.forEach(query, function(param) {
            if (_.startsWith(param, "page=")) {
                next.push("page=" + (parseInt(param.split("=")[1]) + 1));
            } else {
                next.push(param);
            }
        });
        return next;
    }
};
