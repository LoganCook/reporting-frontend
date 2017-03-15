define(['pageComponents'], function (pageComponents) {
  'use strict'
  pageComponents.directive('blankSafe', ['$compile', 'theConstants', function($compile, theConstants) {
    return {
      restrict: 'A',
      scope: {
        blankSafe: '='
      },
      link: function (scope, element, attrs) {
        var theValue = scope.blankSafe
        if (typeof theValue === 'undefined') {
          theValue = theConstants.blankValue
        }
        var content;
        if (theValue === theConstants.blankValue) {
          content = angular.element('<span class="blank-value">(no value)</span>')
        } else {
          content = angular.element('<span>' + theValue + '</span>')
        }
        element.append(content)
      }
    }
  }])
})
