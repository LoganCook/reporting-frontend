var filesize = require("filesize");
var moment = require("moment");
var numeral = require("numeral");
var _ = require("lodash");

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

    keyArray: function(records, key) {
        var result = {};

        _.forEach(records, function(record) {
            result[record[key ? key : "id"]] = record;
        });

        return result;
    },

    api: function(object, name) {
        return function(parameters) {
            return object.get(object.base + name + (parameters ? ("?" + parameters.join("&")) : ""));
        };
    }
};
