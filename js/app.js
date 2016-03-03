console.log("This is app.js");
define(function (require) {
    'use strict';
    //var angular = require('angular');
    var app = angular.module("reportingApp", ["ngSanitize", "ui.router", "ui.bootstrap"]);
    //angular.module("reportingApp", []);
    var app = {};
    app.init = function () {
        angular.bootstrap(document, ["reportingApp"]);
        console.log('doing nothing');
    };

    return app;
});
