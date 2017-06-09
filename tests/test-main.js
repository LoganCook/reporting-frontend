var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

// Get a list of all the test files to include
// https://karma-runner.github.io/1.0/plus/requirejs.html
Object.keys(window.__karma__.files).forEach(function (file) {
  if (TEST_REGEXP.test(file)) {
    allTestFiles.push(file);
  }
});

require.config({
  baseUrl: '/base/js',

  paths: {
    'axios': '../lib/axios/dist/axios.min',
    'lodash': '../lib/lodash/lodash.min',
    'filesize': '../lib/filesize/lib/filesize.min',
    "mathjs": '../lib/mathjs/dist/math.min',
    "moment": '../lib/moment/min/moment.min',
    "numeral": '../lib/numeral/min/numeral.min',
    'qs': '../node_modules/qs/dist/qs',
    'angular': '../lib/angular/angular.min',
    'spin': '../lib/spin.js/spin.min',
    'pageComponents': '../js/components/pageComponents',
    'datePickers': "../js/components/datePickers/date-pickers",
    'datePickerUib': '../js/components/datePickerUib/date-picker-uib',
    'ersaTable': '../js/directives/ersaTable/ersa-table',
    'blankSafe': '../js/directives/blankSafe/blank-safe',
    'userRollupErrors': '../js/components/userRollupErrors/user-rollup-errors'
  },
  shim: {
    "angular": { exports: "angular" },
  },

  // dynamically load all test files
  deps: allTestFiles,

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
