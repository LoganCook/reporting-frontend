var allTestFiles = [];
var TEST_REGEXP = /tests\/.+\.spec\.js$/i;
// var TEST_REGEXP = /tests\/.+\-spec\.js$/i

// Get a list of all the test files to include
// https://karma-runner.github.io/1.0/plus/requirejs.html
Object.keys(window.__karma__.files).forEach(function (file) {
  // console.log(file);
  if (TEST_REGEXP.test(file)) {
    allTestFiles.push(file);
  }
});

require.config({
  baseUrl: '/base/js',

  paths: {
      'ng-csv' : '../lib/ng-csv/build/ng-csv.min',
      'axios' : '../lib/axios/dist/axios.min',
      'lodash': '../lib/lodash/lodash.min',
      'filesize': '../lib/filesize/lib/filesize.min',
      "mathjs": '../lib/mathjs/dist/math.min',
      "moment": '../lib/moment/min/moment.min',
      "numeral": '../lib/numeral/min/numeral.min',
      'qs': '../node_modules/qs/dist/qs',
      'pageComponents': 'components/pageComponents',
      'datePickerUib': 'components/datePickerUib/date-picker-uib',
      'angular': '../lib/angular/angular',
      'spin': '../lib/spin.js/spin.min'
  },
  shim: {
      "ng-csv": { exports: "ng-csv" },
      "angular": { exports: "angular" },
  },

  // dynamically load all test files
  deps: allTestFiles,

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
