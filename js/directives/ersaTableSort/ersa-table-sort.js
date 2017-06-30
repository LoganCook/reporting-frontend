define(['pageComponents'], function (pageComponents) {
  'use strict'
  var directiveName = 'ersaTableSort'
  var kebabCaseDirectiveName = 'ersa-table-sort'
  pageComponents.directive(directiveName, ['$compile', function ($compile) {
    return {
      priority: 1000,
      restrict: 'A',
      link: function (scope, element, attrs) {
        var fieldName = attrs[directiveName]
        element.attr('st-sort', fieldName)
        element.attr('st-skip-natural', 'true')
        element.removeAttr(kebabCaseDirectiveName) // stop infinite compile recursion, thanks https://stackoverflow.com/a/19228302/1410035
        element.attr('old-' + kebabCaseDirectiveName, attrs[directiveName])
        $compile(element)(scope)
      }
    }
  }]
  )
})
