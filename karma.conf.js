// Karma configuration
// Generated on Mon Jul 11 2016 12:40:38 GMT+0930 (ACST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'requirejs'],


    // list of files / patterns to load in the browser
    files: [
      'lib/angular/angular.js',
      'lib/angular-resource/angular-resource.min.js',
      'lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
      'lib/angular-bootstrap/ui-bootstrap.min.js',
      'lib/angular-ui-router/release/angular-ui-router.min.js',
      'lib/angular-mocks/angular-mocks.js',
      'lib/angular-sanitize/angular-sanitize.min.js',
      {pattern: 'lib/spin.js/spin.min.js', included: false},
      {pattern: 'lib/angular-spinner/angular-spinner.min.js', included: false},
      {pattern: 'lib/filesize/lib/filesize.min.js', included: false},
      {pattern: 'lib/mathjs/dist/math.min.js', included: false},
      {pattern: 'lib/moment/min/moment.min.js', included: false},
      {pattern: 'lib/numeral/min/numeral.min.js', included: false},
      {pattern: 'lib/lodash/lodash.min.js', included: false},
      {pattern: 'lib/ng-csv/build/ng-csv.min.js', included: false},
      {pattern: 'node_modules/qs/dist/qs.js', included: false},
      {pattern: 'lib/axios/dist/axios.min.js', included: false},
      {pattern: 'js/components/**/*.js', included: false},
      {pattern: 'js/**/*.js', included: false},
      {pattern: 'js/*.js', included: false},
      {pattern: 'tests/*.js', included: false},
      'tests/test-main.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
