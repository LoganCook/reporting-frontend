define(['pageComponents'], function (pageComponents) {
  'use strict'
  var directiveName = 'ersaTable'
  var kebabCaseDirectiveName = 'ersa-table'
  pageComponents.directive(directiveName, ['$compile', function ($compile) {
    function pad(value, length) { // https://stackoverflow.com/a/13859571/1410035
      return (value.toString().length < length) ? pad("0" + value, length) : value
    }
    function getDateString() {
      var date = new Date()
      return '' + date.getFullYear() + pad(date.getMonth()+1, 2) + pad(date.getDate(), 2)
    }
    return {
      terminal: true,
      priority: 1000,
      restrict: 'A',
      link: function (scope, element, attrs) {
        var tableName = attrs[directiveName]
        var csvExporterVarName = 'csvExporter' + attrs.$normalize(tableName)
        element.attr('export-csv', csvExporterVarName)
        element.removeAttr(kebabCaseDirectiveName) // stop infinite compile recursion, thanks https://stackoverflow.com/a/19228302/1410035
        element.attr('old-' + kebabCaseDirectiveName, attrs[directiveName])
        element.addClass('table').addClass('table-striped')
        $compile(element)(scope)

        var anchor = angular.element(
          '<a class="btn" title="Export Table" ' +
              'ng-click="' + csvExporterVarName + '.generate()" ' +
              'ng-href="{{ ' + csvExporterVarName + '.link() }}" ' +
              'download="' + tableName + '.' + getDateString() + '.csv">' +
            '<i class="glyphicon glyphicon-new-window"></i> &#160;Export ' + attrs[directiveName] + ' view as CSV' +
          '</a>')
        $compile(anchor)(scope)
        var caption = angular.element('<caption class="text-right"></caption>')
        caption.append(anchor)
        element.prepend(caption)
      }
    }
  }]
  )
})
