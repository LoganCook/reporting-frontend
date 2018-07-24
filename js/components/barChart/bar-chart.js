define(['pageComponents'], function(module) {
    'use strict';
  module.component('ersaBarChart', {
      templateUrl: 'js/components/barChart/bar-chart.html',
      controller: function ChartController($scope, $element, $attrs) {
        var elementId = $element.attr('id');
        var chart = dc.barChart("#" + elementId);
        var url = sessionStorage['record'] + '/fee/summary/?start=1451568600&end=1530368999';


        console.log('hi');
        var data = d3.json("http://localhost:8000/fee/summary/?start=1514727000&end=1517405399");
        d3.json("http://localhost:8000/fee/summary/?start=1514727000&end=1517405399").then(function (usages) {
          console.log(usages);
          usages.forEach(d => {
            console.log(d);
          });
          var ndx = crossfilter(usages),
            schoolDimension = ndx.dimension(function (d) {
              return d.unit;
              //return d.biller;
            }),
            feeGroup = schoolDimension.group().reduceSum(function (d) {
              return d.totalAmount;
            });

          var schools = schoolDimension.group().all().map(school => school.key);
          console.log(schools);
          console.log("Can we display this?");
          console.log(feeGroup.all());

          chart.width(1024)
            .height(480)
            .x(d3.scaleOrdinal().domain(schools))
            .xUnits(dc.units.ordinal)
            // .elasticX(true)
            // //.x(d3.scale.linear().domain([0, 6]))
            // .brushOn(false)
            // .yAxisLabel("VM counts")
            // .xAxisLabel("School")
            .dimension(schoolDimension)
            .group(feeGroup);
          chart.render();
          // chart.renderlet(function (chart) {
          //   // rotate x-axis labels
          //   chart.selectAll('g.x text')
          //     .attr('transform', 'translate(-10,-100) rotate(-90)');
          // });
        });
      },
      bindings: {
          chartTitle: '@'
      }
  });
});
