var angular = require("angular");

var reportingApp = angular.module("reportingApp", [require("angular-sanitize"), require("ng-csv"), require("angular-ui-router"), require("angular-ui-bootstrap")]);

reportingApp.factory("reporting", ["$timeout", require("./client")]);

reportingApp.controller("CRMController", ["$rootScope", "$scope", "$timeout", "reporting", require("./identity/crm")]);

reportingApp.controller("BusinessController", ["$rootScope", "$scope", "$timeout", "reporting", require("./business/business")]);

reportingApp.controller("HPCController", ["$rootScope", "$scope", "$timeout", "reporting", require("./hpc/hpc")]);

reportingApp.controller("FilesystemController", ["$rootScope", "$scope", "$timeout", "reporting", require("./storage/fs")]);
reportingApp.controller("XFSController", ["$rootScope", "$scope", "$timeout", "reporting", require("./storage/xfs")]);
reportingApp.controller("HNASController", ["$rootScope", "$scope", "$timeout", "reporting", require("./storage/hnas")]);
reportingApp.controller("HCPController", ["$rootScope", "$scope", "$timeout", "reporting", require("./storage/hcp")]);

reportingApp.controller("KeystoneController", ["$rootScope", "$scope", "$timeout", "reporting", require("./cloud/keystone")]);
reportingApp.controller("CinderController", ["$rootScope", "$scope", "$timeout", "reporting", require("./cloud/cinder")]);
reportingApp.controller("NovaController", ["$rootScope", "$scope", "$timeout", "reporting", require("./cloud/nova")]);
reportingApp.controller("SwiftController", ["$rootScope", "$scope", "$timeout", "reporting", require("./cloud/swift")]);

reportingApp.controller("HomeController", ["$rootScope", "$scope", "$timeout", "reporting", require("./home")]);
reportingApp.controller("MenuController", ["$rootScope", "$scope", "$timeout", "reporting", require("./menu")]);

reportingApp.config(["$stateProvider", "$urlRouterProvider", require("./route")]);
