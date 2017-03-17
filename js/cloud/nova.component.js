define(['app', 'options', '../util2', '../util', './services'], function(app, options, util, formater) {
  'use strict';

  function NovaController(queryResource, $q, flavor, tenant, spinner) {
    var ctrl = this;
    var pageSize = options.nova.size;
    // These variables are set in search and used in loadNextPage
    var startTimestamp, endTimestamp;

    // defaults
    ctrl.selectedDomain = '';
    ctrl.instancesState = [];
    ctrl.pages = 0;
    ctrl.currentPage = 0;

    // For creating table and exporting csv
    ctrl.colTitles = ['Tenant', 'Server ID', 'Server Name', 'Hypervisorname',
      'Inventory Code', 'Hours', 'VCPUs', 'Usage', 'RAM', 'Disk', 'Ephemeral'];
    ctrl.fieldNames = ['tenant_name', 'server_id', 'server', 'hypervisor',
      'flavorname', 'span', 'vcpus', 'usage', 'ram', 'disk','ephemeral'];

    ctrl.pickers = options.nova.pickers;

    // Expecting simple string array
    ctrl.domains = options.nova.domains;

    // retrieve dates inuts from user and do a search
    ctrl.search = function(dates) {
      // Assume we have only two, and 0 should earlier than 1:
      if (dates[0] > dates[1]) {
        alert(dates[0] + " is later than " + dates[1]);
      } else {
        startTimestamp = util.dateToTimestamp(dates[0]);
        endTimestamp = util.dateToTimestamp(dates[1], true);
        ctrl.instancesState = [];
        ctrl.pages = 0;
        ctrl.currentPage = 0;
        getInstances(startTimestamp, endTimestamp, 1);
      }
    };

    ctrl.loadNextPage = function() {
      if (ctrl.currentPage < ctrl.pages) {
        getInstances(startTimestamp, endTimestamp, ctrl.currentPage + 1);
      }
    };

    // Internal functions
    function getInstances(startTime, endTime, page) {
      spinner.start();
      var args = {
        object: 'summary',
        start: startTime,
        end: endTime,
        count: pageSize,
        page: page,
        distinct: true
      };
      var nq = queryResource.build(sessionStorage['nova']);
      nq.get(args, function(summaries) {
        //console.log(summaries.total, summaries.pages, summaries.page);

        if (ctrl.currentPage == 0 && summaries.pages > 1) {
          //console.log("There are " + summaries.total + " records on " + summaries.pages + " pages and only the first page is loaded");
          ctrl.pages = summaries.pages;
        }

        getInstanceState(summaries.items, startTime, endTime)
          .then(doCalculation)
          .then(fillTenants)
          .then(function(states) {
            spinner.stop();
            ctrl.instancesState = ctrl.instancesState.concat(states);
            ctrl.currentPage = page;
          });
      }, function(rsp) {
        spinner.stop();
        alert("Data could not be retrieved. Please try it later.");
        console.log(rsp);
      });
    }

    function getInstanceState(ids, startTime, endTime) {
      var nq = queryResource.build(sessionStorage['nova']),
        states = [];
      var subargs = {
        object: 'instance',
        start: startTime,
        end: endTime
      };

      angular.forEach(ids, function(id) {
        subargs['id'] = id;
        states.push(nq.get(subargs).$promise);
      });

      var deferred = $q.defer();
      $q.all(states).then(
        function(results) {
          var returnV = [];
          angular.forEach(results, function(v) {
            returnV.push(v.toJSON());
          });
          deferred.resolve(returnV);
        },
        function(errors) {
          deferred.reject(errors);
        }
      );

      return deferred.promise;
    }

    function doCalculation(states) {
      return flavor(sessionStorage['nova']).then(function(flavorMap) {
        for (var i = 0, l = states.length; i < l; i++) {
          setFlavor(states[i], flavorMap);
          formatOutputs(states[i]);
        }
        return states;
      });
    }

    function setFlavor(instance, flavorMap) {
      var flavorAttrs = ['name', 'vcpus', 'ram', 'disk', 'ephemeral'];
      if (instance['flavor'] in flavorMap) {
        angular.forEach(flavorAttrs, function(attr) {
          if (attr === 'name') {
            instance['flavorname'] = flavorMap[instance['flavor']][attr];
          } else {
            instance[attr] = flavorMap[instance['flavor']][attr];
          }
        });
      } else {
        angular.forEach(flavorAttrs, function(attr) {
          if (attr === 'name') {
            instance['flavorname'] = '-';
          } else {
            instance[attr] = '-';
          }
        });
      }
    }

    function formatOutputs(instance) {
      // usage before rounding up span
      instance['usage'] = formater.formatDuration(instance['span'] * instance['vcpus'], 'seconds');
      instance['span'] = (instance['span'] / 3600).toFixed(1);
      instance['ram'] = formater.formatNumber(instance['ram']);
    }

    function fillTenants(states) {
      var tenantQuery = tenant(sessionStorage['keystone']),
        queryies = [];
      states.forEach(function(state) {
        queryies.push(tenantQuery(state['tenant']));
      });

      var deferred = $q.defer();
      $q.all(queryies).then(function(details) {
        details.forEach(function(detail, index) {
          if ('name' in detail) {
            states[index]['tenant_name'] = detail['name'];
          } else {
            states[index]['tenant_name'] = states[index]['tenant'];
          }
        });
        deferred.resolve(states);
      });
      return deferred.promise;
    }

  }

  app.component('nova', {
    templateUrl: 'js/cloud/nova.component.html',
    controller: NovaController
  });
});
