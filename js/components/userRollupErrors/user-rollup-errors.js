define(['pageComponents'], function (module) {
  'use strict'
  module.component('userRollupErrors', {
    templateUrl: 'js/components/userRollupErrors/user-rollup-errors.html',
    controller: ['$scope', function ($scope) {
      var ctrl = this
      $scope.isRollupError = function () {
        if (typeof ctrl.isAllSuccess === 'undefined') {
          return false
        }
        return !ctrl.isAllSuccess
      }
      $scope.rollupErrorsCount = function () {
        return ctrl.errorCount
      }
    }],
    bindings: {
      isAllSuccess: '=',
      errorCount: '='
    }
  })
})
