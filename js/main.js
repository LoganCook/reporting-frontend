require.config({
  //enforceDefine: true, //This is for IE error handling: http://requirejs.org/docs/api.html#ieloadfail. use define instead of a normal js file
  paths: {
    'ng-csv': '../lib/ng-csv/build/ng-csv.min',
    'ng-table-to-csv': '../lib/ng-table-to-csv/dist/ng-table-to-csv.min',
    'axios': '../lib/axios/dist/axios.min',
    'lodash': '../lib/lodash/lodash.min',
    'filesize': '../lib/filesize/lib/filesize.min',
    "mathjs": '../lib/mathjs/dist/math.min',
    "moment": '../lib/moment/min/moment.min',
    "numeral": '../lib/numeral/min/numeral.min',
    'qs': '../node_modules/qs/dist/qs',
    'pageComponents': 'components/pageComponents',
    'datePickers': "components/datePickers/date-pickers",
    'datePickerUib': 'components/datePickerUib/date-picker-uib',
    'ersaTable': 'directives/ersaTable/ersa-table',
    'blankSafe': 'directives/blankSafe/blank-safe'
  },
  shim: {
    "ng-csv": {
      exports: "ng-csv"
    }
  },
  baseUrl: 'js'
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
    "cloud/keystone", "cloud/nova.component", "cloud/novasummary",
    //"cloud/keystone", "cloud/nova", "cloud/cinder","cloud/swift",
  ],
  function (app) {
    app.config(function (AuthServiceProvider) {
      AuthServiceProvider.setUp(sessionStorage['email']);
    });
    require(["route"], function (route) {
      app.config(["$stateProvider", "$urlRouterProvider", "AuthServiceProvider", route]).run(function (org, AuthService) {
        if (AuthService.isAdmin()) {
          // load all organisations and their accounts
          org.getOrganisations(true);
        } else {
          org.getOrganisations(false).then(function () {
            org.getUsersOf(org.getOrganisationId(AuthService.getUserOrgName()));
          });
        }
      });
      angular.bootstrap(document, ["reportingApp"]);
    });
  }
);