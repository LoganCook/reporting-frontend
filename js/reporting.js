var angular = require("angular");

// browserify problems with ngStorage, so handle separately

var reportingApp = angular.module("reportingApp", ["ngStorage", require("angular-sanitize"), require("ng-csv"), require("angular-ui-router"), require("angular-ui-bootstrap")]);

reportingApp.factory("reporting", ["$localStorage", "$timeout", require("./client")]);

reportingApp.controller("CRMController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./identity/crm")]);

reportingApp.controller("SandboxController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./business/sandbox")]);

reportingApp.controller("HPCController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./hpc/overview")]);

reportingApp.controller("FilesystemController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./storage/fs")]);
reportingApp.controller("XFSController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./storage/xfs")]);
reportingApp.controller("HNASController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./storage/hnas")]);
reportingApp.controller("HCPController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./storage/hcp")]);

reportingApp.controller("KeystoneController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./cloud/keystone")]);
reportingApp.controller("CinderController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./cloud/cinder")]);
reportingApp.controller("NovaController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./cloud/nova")]);
reportingApp.controller("SwiftController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./cloud/swift")]);
reportingApp.controller("CeilometerController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./cloud/ceilometer")]);

reportingApp.controller("HomeController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./home")]);
reportingApp.controller("MenuController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./menu")]);
reportingApp.controller("SettingsController", ["$rootScope", "$scope", "$timeout", "$localStorage", "$sessionStorage", "reporting", require("./settings")]);

reportingApp.config(["$stateProvider", "$urlRouterProvider", require("./route")]);
