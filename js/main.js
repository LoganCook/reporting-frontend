require.config({
  //enforceDefine: true, //This is for IE error handling: http://requirejs.org/docs/api.html#ieloadfail. use define instead of a normal js file
  paths: {
    'axios': '../lib/axios/dist/axios.min',
    'lodash': '../lib/lodash/lodash.min',
    'filesize': '../lib/filesize/lib/filesize.min',
    "mathjs": '../lib/mathjs/dist/math.min',
    "moment": '../lib/moment/min/moment.min',
    "numeral": '../lib/numeral/min/numeral.min',
    'angular': '../lib/angular/angular.min', // defined here again (already in index.html) for angularDc's require
    'qs': '../node_modules/qs/dist/qs',
    'd3': '../lib/d3/d3.min',
    'crossfilter2': '../lib/crossfilter2/crossfilter.min',
    'dc': '../lib/dcjs/dc.min',
    'angularDc': '../lib/angular-dc/dist/angular-dc', // TODO#56 set back to .min script
    'pageComponents': 'components/pageComponents',
    'datePickers': 'components/datePickers/date-pickers',
    'datePickerUib': 'components/datePickerUib/date-picker-uib',
    'ersaTable': 'directives/ersaTable/ersa-table',
    'ersaTableSort': 'directives/ersaTableSort/ersa-table-sort',
    'ersaTableAddFilters': 'directives/ersaTableAddFilters/ersa-table-add-filters',
    'blankSafe': 'directives/blankSafe/blank-safe',
    'userRollupErrors': 'components/userRollupErrors/user-rollup-errors',
    'ersaLineBarChart': 'components/ersaLineBarChart/ersa-line-bar-chart',
    'ersaStackedBarChart': 'components/ersaStackedBarChart/ersa-stacked-bar-chart'
  },
  baseUrl: 'js',
  shim: {
    'angular': { // angular does not support AMD out of the box, put it in a shim
      exports: 'angular'
    },
    'crossfilter2': {
      exports: 'crossfilter'
    }
  },
  map: {
    'crossfilter': 'crossfilter2'
  }
});

//TODO: May have seperated dev and production main.js files or gulp it?
require(["debug-settings"], function (d) {
  for (var attr in d) {
    if (d.hasOwnProperty(attr)) sessionStorage[attr] = d[attr];
  }
}, function (err) {
  console.log("Cannot load settings, skip set up debug session.[" + JSON.stringify(err) + "]");
});

require(["app", "services/auth", "services/org", "menu",
    //"identity/crm",
    "hpc/hpc", "hpc/hpcsummary",
    "storage/hcp", "storage/hnas/fileSystem", "storage/hnas/virtualVolume", "storage/xfs",
    //"storage/fs", "storage/hcp", "storage/hnas", "storage/hnas/fileSystem",  "storage/hnas/virtualVolume", "storage/xfs",
    "storage/hpcStorage", "storage/ahpcStorage",
    "storage/allocationSummary", "storage/aallocationSummary",
    "storage/allocationANDSReport", "storage/aallocationRDSReport",
    "cloud/keystone", "cloud/nova.component", "cloud/novasummary",
    //"cloud/keystone", "cloud/nova", "cloud/cinder","cloud/swift",
  ],
  function (app) {
    app.config(function (AuthServiceProvider) {
      AuthServiceProvider.setUp(sessionStorage['email']);
    });
    app.run(['$rootScope', '$state', function($rootScope, $state) {
      $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        var errorStateName = 'errorreport'
        event.preventDefault()
        $state.get('errorreport').runtimeErrorDetails = error
        $state.go(errorStateName)
      })
    }])
    require(["route"], function (route) {
      app.config(["$stateProvider", "$urlRouterProvider", "AuthServiceProvider", route])
      angular.bootstrap(document, ["reportingApp"]);
    });
  }
);