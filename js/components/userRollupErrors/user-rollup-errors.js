define(['pageComponents'], function (module) {
  'use strict'
  module.component('userRollupErrors', {
    templateUrl: 'js/components/userRollupErrors/user-rollup-errors.html',
    controller: ['$scope', function ($scope) {
      var ctrl = this
      $scope.isClosed = false
      this.$onChanges = function (disregardChanges) {
        $scope.isClosed = false
      }
      $scope.closedHandler = function () {
        $scope.isClosed = true
      }
      $scope.isDisplayed = function () {
        if (typeof ctrl.isAllSuccess === 'undefined') {
          return false
        }
        if ($scope.isClosed) {
          return false
        }
        return !ctrl.isAllSuccess
      }
      $scope.rollupErrors = function () {
        if (ctrl.errors && ctrl.errors.constructor === Array) {
          return ctrl.errors
        }
        return []
      }
      $scope.rollupErrorsCount = function () {
        return $scope.rollupErrors().length
      }
    }],
    bindings: {
      isAllSuccess: '<', // boolean
      errors: '<' // string[]
    }
  })
})
