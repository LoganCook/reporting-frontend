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
    }
};
