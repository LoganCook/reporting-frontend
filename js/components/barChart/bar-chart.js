define(['pageComponents'], function(module) {
  'use strict';

  function getNames(dimension) {
    return dimension.group().all().map(item => item.key);
  }

  module.component('ersaBarChart', {
      templateUrl: 'js/components/barChart/bar-chart.html',
      controller: function ChartController($scope, $element, $attrs) {
        var elementId = $element.attr('id');
        var chart = dc.barChart("#" + elementId);
        var url = sessionStorage['record'] + '/fee/summary/?start=1451568600&end=1530368999';
        d3.json(url).then(function (fee) {
          var ndx = crossfilter(fee),
            accountDimension = ndx.dimension(function (d) {
                return d.account;
            }),
            accountFeeGroup = accountDimension.group().reduceSum(function (d) {
                return d.totalAmount;
            }),
            unitDimension = ndx.dimension(function (d) {
                return d.unit;
              }),
            unitFeeGroup = unitDimension.group().reduceSum(function (d) {
              return d.totalAmount;
            });

          var xTicks = getNames(accountDimension);

          chart.width(1024)
            .height(480)
            .x(d3.scaleOrdinal().domain(xTicks))
            .xUnits(dc.units.ordinal)
            .elasticX(true)
            .brushOn(false)
            .yAxisLabel("Fee")
            .xAxisLabel("Account")
            .dimension(accountDimension)
            .group(accountFeeGroup);
          chart.render();
          chart.renderlet(function (chart) {
            // rotate x-axis labels
            chart.selectAll('g.x text')
              .attr('transform', 'translate(-10,-100) rotate(-90)');
          });
        });
      },
      bindings: {
          chartTitle: '@'
      }
  });
});
