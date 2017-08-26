define(['pageComponents', 'dc'], function (module, dc) {
  'use strict'
  module.component('ersaLineBarChart', {
    templateUrl: 'js/components/ersaLineBarChart/ersa-line-bar-chart.html',
    controller: ['$scope', function ($scope) {
      var months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'] // TODO add all months
      var records = [
        {
          'job_count': 50,
          'cost': 840.6652083333332,
          'month': 3
        },
        {
          'job_count': 259,
          'cost': 5523.270791666667,
          'month': 3
        },
        {
          'job_count': 7,
          'cost': 53.43212499999999,
          'month': 3
        },
        {
          'job_count': 1,
          'cost': 0.004416666666666666,
          'month': 3
        },
        {
          'job_count': 13,
          'cost': 22.516416666666668,
          'month': 4
        },
        {
          'job_count': 3,
          'cost': 11.192499999999999,
          'month': 4
        },
        {
          'job_count': 149,
          'cost': 1141.309,
          'month': 4
        },
        {
          'job_count': 3710,
          'cost': 2653.7895833333337,
          'month': 5
        },
        {
          'job_count': 303,
          'cost': 874.6545416666668,
          'month': 5
        },
        {
          'job_count': 3,
          'cost': 61.35575,
          'month': 6
        },
        {
          'job_count': 258,
          'cost': 8706.824333333334,
          'month': 6
        },
        {
          'job_count': 144,
          'cost': 0.08325,
          'month': 6
        },
        {
          'job_count': 144,
          'cost': 96.08866666666665,
          'month': 7
        },
        {
          'job_count': 7,
          'cost': 155.16479166666667,
          'month': 7
        },
        {
          'job_count': 76,
          'cost': 557.5580416666667,
          'month': 7
        },
        {
          'job_count': 59,
          'cost': 404.1209583333333,
          'month': 8
        },
        {
          'job_count': 189,
          'cost': 146.69391666666664,
          'month': 8
        }
      ]
      var ndx = crossfilter(records)
      $scope.monthDimension = ndx.dimension(function (d) {
        return d.month
      })
      $scope.$watch('theChart', function (newValue, oldValue) {
        if (!newValue) {
          return
        }
        var theChart = newValue
        theChart.compose([
          barChart(theChart, $scope.monthDimension, 'cost', 'blue', 'Cost ($)'),
          lineChart(theChart, $scope.monthDimension, 'job_count', 'red', 'Job count')
            .useRightYAxis(true)
        ])
        theChart._rangeBandPadding(1)
        theChart.xAxis().tickFormat(function (v) {
          return months[v]
        })
        theChart.yAxis().tickFormat(function (v) { return (v / 1000) + 'k' })
        theChart.rightYAxis().tickFormat(function (v) { return (v / 1000) + 'k' })
        theChart.render()
      })
      $scope.legend = dc.legend().x(70).y(10).itemHeight(13).gap(5)
      function lineChart (parentChart, dimension, groupField, colour, groupName) {
        var group = dimension.group().reduceSum(function (d) {
          return d[groupField]
        })
        var result = dc.lineChart(parentChart)
          .yAxisLabel('', 20)
          .yAxisPadding('10%')
          .ordinalColors([colour])
          .group(group, groupName)
          .renderDataPoints(true)
          .dimension(dimension)
          .interpolate('cardinal')
          .title(function (d) {
            return months[d.key] + '=' + d.value
          })
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
    }],
    bindings: {
      // isAllSuccess: '<', // boolean
    }
  })
})
