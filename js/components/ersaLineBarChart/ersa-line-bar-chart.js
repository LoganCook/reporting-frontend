define(['pageComponents', 'dc'], function (module, dc) {
  'use strict'
  var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  module.component('ersaLineBarChart', {
    templateUrl: 'js/components/ersaLineBarChart/ersa-line-bar-chart.html',
    controller: ['$scope', controller],
    bindings: {
      // mandatory
      elbcData: '=', // [{}]
      elbcBarYAxisLabel: '=', // string
      elbcBarFieldName: '=', // string
      elbcBarColour: '=', // string - can be name or hex
      elbcLineYAxisLabel: '=', // string
      elbcLineFieldName: '=', // string
      elbcLineColour: '=', // string - can be name or hex
      elbcWidth: '=', // number - pixels of width
      elbcHeight: '=', // number - pixels of height
      elbcAllFilterLabel: '=', // string - label for 'All' in filter
      // optional
      elbcIsElasticY: '=' // boolean - default true
    }
  })

  function controller ($scope) {
    var records = $scope.$ctrl.elbcData
    $scope.allFilterLabel = $scope.$ctrl.elbcAllFilterLabel
    var ndx = crossfilter(records)
    $scope.monthDimension = ndx.dimension(function (d) {
      return d.month
    })
    $scope.filterDimension = ndx.dimension(function (d) {
      return d.organisation
    })
    $scope.filterChartPostSetup = function (theFilter, _) {
      var filterContainer = angular.element(theFilter.anchor())
      var selectElement = filterContainer.children('select')
      selectElement.addClass('form-control')
    }
    $scope.lineBarChartPostSetup = function (theChart, _) {
      theChart.compose([
        barChart(theChart, $scope.monthDimension, $scope.$ctrl.elbcBarFieldName, $scope.$ctrl.elbcBarColour, $scope.$ctrl.elbcBarYAxisLabel),
        lineChart(theChart, $scope.monthDimension, $scope.$ctrl.elbcLineFieldName, $scope.$ctrl.elbcLineColour, $scope.$ctrl.elbcLineYAxisLabel)
          .useRightYAxis(true)
      ])
      theChart._rangeBandPadding(1)
      theChart.xAxis().tickFormat(function (v) {
        return months[v]
      })
      theChart.yAxis().tickFormat(function (v) { return (v / 1000) + 'k' })
      theChart.rightYAxis().tickFormat(function (v) { return (v / 1000) + 'k' })
      var isElasticY = true
      if ($scope.$ctrl.elbcIsElasticY === false) {
        isElasticY = false
      }
      theChart.elasticY(isElasticY)
      // theChart.svg() // TODO#56 get title showing
      //   .append('text')
      //   .attr('text-anchor', 'middle')
      //   .attr('x', theChart.width() / 2)
      //   .attr('y', 22)
      //   .text('TODO title') // TODO#56 add title param
      // theChart.render()
    }
    $scope.legend = dc.legend().x(70).y(10).itemHeight(13).gap(5)
  }

  function lineChart (parentChart, dimension, groupField, colour, groupName) {
    var group = dimension.group().reduceSum(function (d) {
      return d[groupField]
    })
    var dotRadius = 5
    var result = dc.lineChart(parentChart)
      .yAxisLabel('', 20)
      .yAxisPadding('10%')
      .ordinalColors([colour])
      .group(group, groupName)
      .renderDataPoints(true)
      .dimension(dimension)
      .interpolate('linear')
      .title(function (d) {
        return months[d.key] + '=' + d.value
      })
      .renderDataPoints({
        fillOpacity: 0.8,
        strokeOpacity: 0.8,
        radius: dotRadius
      })
      .dotRadius(dotRadius * 1.4)
    return result
  }
  function barChart (parentChart, dimension, groupField, colour, groupName) {
    var group = dimension.group().reduceSum(function (d) {
      return d[groupField]
    })
    var result = dc.barChart(parentChart)
      .yAxisLabel('', 20)
      .yAxisPadding('10%')
      .ordinalColors([colour])
      .group(group, groupName) // thanks https://stackoverflow.com/a/33267720/1410035
      .gap(1)
      .centerBar(true)
      .title(function (d) {
        return months[d.key] + '=' + d.value
      })
    return result
  }
})
