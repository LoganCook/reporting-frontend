require.config({
  paths: {
      'angular' : '/lib/angular/angular',
      'ng-csv' : '/lib/ng-csv/build/ng-csv.min',
      'axios' : '/lib/axios/dist/axios.min',
      'lodash': '/lib/lodash/lodash.min',
      'filesize': '/lib/filesize/lib/filesize.min',
      "mathjs": '/lib/mathjs/dist/math.min',
      "moment": '/lib/moment/min/moment.min',
      "numeral": '/lib/numeral/min/numeral.min',
      'qs': '/node_modules/qs/dist/qs'
  },
  shim: {
      angular: {
          exports : 'angular'
      },
      "ng-csv": { deps: ['angular'], exports: "ng-csv" }
  },
  baseUrl: '/js'
});

define("app", function() {
    var app = angular.module("reportingApp", ["ngSanitize", "ui.router", "ui.bootstrap"]);
    return app;
});

require(["app", "menu", "client"],
    function () {
        angular.bootstrap(document, ["reportingApp"]);
    }
);
