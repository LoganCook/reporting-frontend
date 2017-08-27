define(['pageComponents', 'dc'], function (module, dc) {
  'use strict'
  var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  module.component('ersaStackedAreaChart', {
    templateUrl: 'js/components/ersaStackedAreaChart/ersa-stacked-area-chart.html',
    controller: ['$scope', controller],
    bindings: {
      // mandatory
      esacData: '=', // [{}]
      esacYAxisLabel: '=', // string
      esacStacks: '=', // [{fieldName:string, label:string}]
      esacWidth: '=', // number - pixels of width
      esacHeight: '=', // number - pixels of height
      // optional
      esacIsElasticY: '=' // boolean - default true
    }
  })

  function controller ($scope) {
    var records = $scope.$ctrl.esacData
    var ndx = crossfilter(records)
    $scope.monthDimension = ndx.dimension(function (d) {
      return d.month
    })
    $scope.schoolDimension = ndx.dimension(function (d) {
      return d.organisation
    })
    $scope.$watch('theFilter', function (newValue, oldValue) {
      if (!newValue) { // TODO#56 might need a more robust way to determine when to stop redrawing
        return
      }
      var theFilter = newValue
      var filterContainer = angular.element(theFilter.anchor())
      var selectElement = filterContainer.children('select')
      selectElement.addClass('form-control')
    })
    $scope.$watch('theChart', function (newValue, oldValue) {
      if (!newValue) { // TODO#56 might need a more robust way to determine when to stop redrawing
        return
      }
      var theChart = newValue
      theChart.xAxis().tickFormat(function (v) {
        return months[v]
      })
      var stacks = $scope.$ctrl.esacStacks
      var isFirst = true
      stacks.forEach(function (curr) {
        var group = $scope.monthDimension.group().reduceSum(function (d) {
          return d[curr.fieldName]
        })
        if (isFirst) {
          isFirst = false
          theChart.group(group, curr.label)
          return
        }
        theChart.stack(group, curr.label)
      })
      theChart.yAxis().tickFormat(function (v) { return (v / 1000) + 'k' })
      var isElasticY = true
      if ($scope.$ctrl.esacIsElasticY === false) {
        isElasticY = false
      }
      theChart.elasticY(isElasticY)
      theChart.svg() // TODO#56 get title showing
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('x', theChart.width() / 2)
        .attr('y', 22)
        .text('TODO title') // TODO#56 add title param
      theChart.render()
    })
    $scope.legend = dc.legend().x(70).y(10).itemHeight(13).gap(5)
  }
})
