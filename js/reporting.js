var angular = require("angular");

// browserify problems with ngStorage, so handle separately

var reportingApp = angular.module("reportingApp", ["ngStorage", require("angular-resource"), require("angular-ui-router"), require("angular-ui-bootstrap")]);

reportingApp.controller("CRMController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./identity/crm")]);

reportingApp.controller("HPCController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./hpc/overview")]);

reportingApp.controller("FilesystemController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./storage/fs")]);
reportingApp.controller("XFSController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./storage/xfs")]);
reportingApp.controller("HNASController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./storage/hnas")]);
reportingApp.controller("HCPController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./storage/hcp")]);

reportingApp.controller("KeystoneController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./cloud/keystone")]);
reportingApp.controller("CinderController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./cloud/cinder")]);
reportingApp.controller("NovaController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./cloud/nova")]);
reportingApp.controller("SwiftController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./cloud/swift")]);
reportingApp.controller("CeilometerController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./cloud/ceilometer")]);

reportingApp.controller("HomeController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./home")]);
reportingApp.controller("MenuController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./menu")]);
reportingApp.controller("SettingsController", ["$scope", "$http", "$localStorage", "$sessionStorage", require("./settings")]);

reportingApp.config(["$stateProvider", "$urlRouterProvider", require("./route")]);
