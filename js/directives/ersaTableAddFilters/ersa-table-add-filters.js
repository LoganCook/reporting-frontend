define(['pageComponents'], function (pageComponents) {
  'use strict'
  var directiveName = 'ersaTableAddFilters'
  var kebabCaseDirectiveName = 'ersa-table-add-filters'
  // ersa-table-no-filter - we use this as a marker, we don't even need to define it as a directive
  function reduceToSingleFieldName (fieldName) {
    // some field name values will be function call, possible with an array param.
    // we need to turn that into a single (the correct) field name. We assume the first field.
    var isFieldNameFunctionCall = fieldName.indexOf('(') >= 0
    if (!isFieldNameFunctionCall) {
      return fieldName
    }
    var startIndex
    var isArrayParam = fieldName.indexOf("(['") >= 0
    if (isArrayParam) {
      startIndex = fieldName.indexOf("(['") + 3
    } else { // is function call with string param(s)
      startIndex = fieldName.indexOf("('") + 2
    }
    var valueLength = fieldName.indexOf("'", startIndex) - startIndex
    return fieldName.substr(startIndex, valueLength)
  }
  pageComponents.directive(directiveName, ['$compile', function ($compile) {
    return {
      restrict: 'A',
      compile: function (element, attrs) {
        var trBuilder = '<tr class="export-ignore">'
        var children = element.children()
        var isSpaceForSearchWholeTable = false
        for (var i = 0; i < children.length; i++) {
          var curr = children[i]
          var noFilterAttr = curr.attributes['ersa-table-no-filter']
          if (noFilterAttr) {
            isSpaceForSearchWholeTable = true
            continue
          }
          var cellRatioAttr = curr.attributes['cell-ratio']
          var ersaTableSortAttr = curr.attributes['ersa-table-sort']
          var fieldName = reduceToSingleFieldName(ersaTableSortAttr.value)
          var fieldTitle = curr.textContent.toLowerCase()
          trBuilder +=
            '<th ' + cellRatioAttr.name + '="' + cellRatioAttr.value + '">' +
              '<input st-search="' + fieldName + '" placeholder="' + fieldTitle + ' filter" class="input-sm form-control" type="search" />' +
            '</th>'
        }
        if (isSpaceForSearchWholeTable) {
          // the same id (searchWholeTable) will appear multiple times on the page, but only one is shown at a time, it seems to work
          trBuilder += 
            '<th>' +
              '<label for="searchWholeTable">Search whole table: </label>' +
              '<input st-search placeholder="search whole table" class="input-sm form-control" type="search" id="searchWholeTable" />' +
            '</th>'
        }
        trBuilder += '</tr>'
        var tr = angular.element(trBuilder)
        element.after(tr)
      }
    }
  }])
  return {
    _testonly: {
      reduceToSingleFieldName: reduceToSingleFieldName
    }
  }
})
