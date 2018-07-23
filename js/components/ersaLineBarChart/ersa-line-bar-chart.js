define(['pageComponents', 'dc', 'crossfilter2'], function (module, dc, crossfilter) {
  'use strict'
  var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  module.component('ersaLineBarChart', {
    templateUrl: 'js/components/ersaLineBarChart/ersa-line-bar-chart.html',
    controller: ['$scope', controller],
    bindings: {
      // mandatory
      elbcData: '<', // [{}]
      elbcBarYAxisLabel: '=', // string
      elbcBarFieldName: '=', // string
      elbcBarColour: '=', // string - can be name or hex
      elbcLineYAxisLabel: '=', // string
      elbcLineFieldName: '=', // string
      elbcLineColour: '=', // string - can be name or hex
      elbcWidth: '=', // number - pixels of width
      elbcHeight: '=', // number - pixels of height
      // optional
      elbcAllFilter1Label: '=', // string - label for 'All' in filter 1
      elbcAllFilter2Label: '=', // string - label for 'All' in filter 2
      elbcFilter1FieldName: '=', // string - field name to use in filter 1
      elbcFilter2FieldName: '=', // string - field name to use in filter 2
      elbcIsElasticY: '=', // boolean - default true
      elbcLeftYAxisTickFunction: '=', // fn(v) => string - tick function to apply
      elbcRightYAxisTickFunction: '=', // fn(v) => string - tick function to apply
      elbcTitle: '=' // string - title for the chart
    }
  })

  function controller ($scope) {
    var records = $scope.$ctrl.elbcData
    $scope.allFilter1Label = $scope.$ctrl.elbcAllFilter1Label
    $scope.filter1Field = $scope.$ctrl.elbcFilter1FieldName
    $scope.allFilter2Label = $scope.$ctrl.elbcAllFilter2Label
    $scope.filter2Field = $scope.$ctrl.elbcFilter2FieldName
    $scope.chartTitle = $scope.$ctrl.elbcTitle
    var ndx = crossfilter(records)
    $scope.monthDimension = ndx.dimension(function (d) {
      return d.month
    })
    if ($scope.filter1Field) {
      $scope.filter1Dimension = ndx.dimension(function (d) {
        return d[$scope.filter1Field]
      })
    }
    if ($scope.filter2Field) {
      $scope.filter2Dimension = ndx.dimension(function (d) {
        return d[$scope.filter2Field]
      })
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
      if ($scope.$ctrl.elbcLeftYAxisTickFunction) {
        theChart.yAxis().tickFormat($scope.$ctrl.elbcLeftYAxisTickFunction)
      }
      if ($scope.$ctrl.elbcRightYAxisTickFunction) {
        theChart.rightYAxis().tickFormat($scope.$ctrl.elbcRightYAxisTickFunction)
      }
      var isElasticY = true
      if ($scope.$ctrl.elbcIsElasticY === false) {
        isElasticY = false
      }
      theChart.elasticY(isElasticY)
    }
    $scope.legend = dc.legend().x(70).y(10).itemHeight(13).gap(5)
  }

  function lineChart (parentChart, dimension, groupField, colour, groupName) {
    var group = dimension.group().reduceSum(function (d) {
      return d[groupField] || 0
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
      return d[groupField] || 0
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
