var filesize = require("filesize");
var moment = require("moment");
var numeral = require("numeral");
var _ = require("lodash");

var defaultQuery = "count=5000";

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

    keyArray: function(records, key) {
        var result = {};

        _.forEach(records, function(record) {
            result[record[key ? key : "id"]] = record;
        });

        return result;
    },

    api: function(name) {
        return function(parameters) {
            var query = parameters ? parameters.join("&") : defaultQuery;
            return this.get(this.base + name + "?" + query);
        };
    },

    chopTime: function(ts) {
        var chopped = new Date(ts);

        chopped.setHours(0);
        chopped.setMinutes(0);
        chopped.setSeconds(0);
        chopped.setMilliseconds(0);

        return chopped;
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
