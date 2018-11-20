define(["menu-data"], function (menuAllData) {

  // TODO: remove duplicate chart code.

  function msToSec(time) {
    return Math.round(time / 1000);
  }

  function secToMs(time) {
    return time * 1000;
  }

  function parseData(data) {

    // Know range.
    let minDate = Number.MAX_VALUE;
    let maxDate = 0;

    data.forEach(function(point) {
      minDate = Math.min(minDate, point['start']);
      maxDate = Math.max(maxDate, point['end']);


      point['startDate'] = secToMs(new Date(point['start'] ));

      // Simplify by grouping.
      if (point['product'] === 'TANGO Cloud VM' || point['product'] === 'Nectar Cloud VM') {
        point['product'] = 'VM';
      } else if (point['product'] === 'eRSA Account' || point['product'] === 'TANGO Compute') {
        point['product'] = 'HPC';
      } else if (point['product'] === 'Attached Storage') {
        point['product'] = 'Storage';
      }
    });

    // Sort alphabetically by product name.
    function compareProduct(a, b) {
      if (a.product > b.product) {
        return -1;
      }
      if (a.product < b.product) {
        return 1;
      }
      return 0;
    }
    data.sort(compareProduct);

    return {
      'data': data,
      'minDate': secToMs(minDate),
      'maxDate': secToMs(maxDate)
    };
  }




  return function ($stateProvider, $urlRouterProvider, AuthServiceProvider) {
    $urlRouterProvider.otherwise("/");

    function resolveOrgs($q, org, AuthService, spinner) {
      spinner.start();
      var deferred = $q.defer();
      function finishedSuccess() {
        spinner.stop();
        deferred.resolve();
      }
      function finishedFailure(reason) {
        spinner.stop();
        var message = 'Failed to load organisation data, cannot continue without it. '
          + 'You can try to reload the page but if it fails again, the problem is with the other server.';
        deferred.reject({
          msgForUi: message,
          reason: reason
        });
      }
      var isLoadAllOrgsAndAccounts = AuthService.isAdmin();
      if (isLoadAllOrgsAndAccounts) {
        org.getOrganisations(isLoadAllOrgsAndAccounts).then(finishedSuccess, finishedFailure);
        return deferred.promise;
      }
      org.getOrganisations(isLoadAllOrgsAndAccounts).then(function () {
        org.getUsersOf(org.getOrganisationId(AuthService.getUserOrgName())).then(finishedSuccess, finishedFailure);
      }, function() {
        spinner.stop();
      });
      return deferred.promise;
    }

    $stateProvider.state("home", {
      url: "/",
      templateUrl: "template/home.html",
      resolve: {
        orgData: resolveOrgs
      }
    }).state("errorreport", {
      templateUrl: "template/errorreport.html",
      resolve: {
        errorDetails: function() {
          return this.self.runtimeErrorDetails
        }
      },
      controller: function($scope, errorDetails) {
        if (errorDetails && errorDetails.msgForUi) {
          $scope.errorMessage = errorDetails.msgForUi
        } else {
          $scope.errorMessage = '(No details provided)'
        }
        $scope.allDetails = JSON.stringify(errorDetails)
      }
    }).state("calculator", {
      url: "/calculator",
      templateUrl: "template/calculator.html"
    }).state("summary", {
      url: "/charts/fee",
      resolve: {
        chartData: function () {
          let maxDate = new Date(8640000000000000); // According to http://es5.github.io/#x15.9.1.1
          var url = sessionStorage['record'] + '/fee/summary/?email=' + sessionStorage['email'] + '&start=0&end=' + msToSec(maxDate);  // Get all data
          return fetch(url, {
            method: "GET",
            headers: {
              "x-ersa-auth-token": sessionStorage["secret"]
            },
          })
          .then(function(response) {
            return response.json();
          });
        }
      },
      templateUrl: "template/charts/fee.html",
      controller: function($scope, chartData) {
        let parsedData = parseData(chartData);  // First time.
        $scope.time = "all-time";
        $scope.chartScopes = [];
        $scope.chartData = parsedData.data;
        let minDate = parsedData.minDate;
        let maxDate = parsedData.maxDate;

        // Get date ranges.
        let dates = [];
        parsedData.data.forEach(function(point) {
          let unique = true;
          for (let i = 0; i < dates.length; i++) {
            if (dates[i].start === point['start'] && dates[i].end === point['end']) {
              unique = false;
              break;
            }
          }
          if (unique) {
            dates.push({'start': point['start'], 'end': point['end']});
          }
        });

        function compareDates(a, b) {
          if (a.start < b.start) {
            return -1;
          }
          if (a.start > b.start) {
            return 1;
          }
          return 0;
        }

        dates.sort(compareDates);

        // Assumes dateList is sorted.
        function lastDate(dateList, previous) {
          if (dateList.length === 0) {
            return {'start': 0, 'end': msToSec(Date.now())};
          }
          let offset = Math.max(0, dateList.length - previous);
          return dateList[offset];
        }


        // Convert input time to UNIX epoch for start time.
        $scope.changeTime = function() {
          let startDate = null;
          let endDate = null;

          // Parse time selected from drop down.
          if ($scope.time === "all-time") {
            startDate = new Date(0);
            endDate = new Date();
          } else if ($scope.time === "last-month") {
            let lastMonth = lastDate(dates, 1);
            startDate = new Date(secToMs(lastMonth.start));
            endDate = new Date(secToMs(lastMonth.end));
          } else if ($scope.time === "last-6-months") {
            startDate = new Date(secToMs(lastDate(dates, 6).start));
            endDate = new Date(secToMs(lastDate(dates, 1).end));
          } else if (!isNaN($scope.time)) { // Whole year.
            let year = parseInt($scope.time);
            startDate = new Date(year, 0, 1);
            endDate = new Date(year + 1, 0, 1);
          }
          startDate = msToSec(startDate.getTime());
          endDate = msToSec(endDate.getTime());

          let url = sessionStorage['record'] + '/fee/summary/?email=' + sessionStorage['email'] + '&start=' + startDate + '&end=' + endDate;
          console.log("REQUEST: \n", new Date(secToMs(startDate)), "\n", new Date(secToMs(endDate)), "\n", url);

          fetch(url, {
            method: "GET",
            headers: {
              "x-ersa-auth-token": sessionStorage["secret"]
            },
          })
          .then(function(response) {
            response.json().then(data => {
              $scope.chartData = parseData(data).data;

              // FIXME: How to trigger recreating the graph with new data without using $scope?
              for (let i = 0; i < $scope.chartScopes.length; i++) {
                $scope.chartScopes[i].$ctrl.updateData($scope);
              }
            })
          });
        }
      }


    }).state("ersasummary", {
      url: "/summary",
      resolve: {
        chartData: function () {
          let maxDate = new Date(8640000000000000); // According to http://es5.github.io/#x15.9.1.1
          var url = sessionStorage['record'] + '/fee/summary/?email=' + sessionStorage['email'] + '&start=0&end=' + msToSec(maxDate);  // Get all data
          return fetch(url, {
            method: "GET",
            headers: {
              "x-ersa-auth-token": sessionStorage["secret"]
            },
          })
          .then(function(response) {
            return response.json();
          });
        }
      },
      templateUrl: "template/chart-demo.html",
      controller: function($scope, chartData) {
        let parsedData = parseData(chartData);  // First time.
        $scope.time = "all-time";
        $scope.chartScopes = [];
        $scope.chartData = parsedData.data;
        let minDate = parsedData.minDate;
        let maxDate = parsedData.maxDate;

        // Get date ranges.
        let dates = [];
        parsedData.data.forEach(function(point) {
          let unique = true;
          for (let i = 0; i < dates.length; i++) {
            if (dates[i].start === point['start'] && dates[i].end === point['end']) {
              unique = false;
              break;
            }
          }
          if (unique) {
            dates.push({'start': point['start'], 'end': point['end']});
          }
        });

        function compareDates(a, b) {
          if (a.start < b.start) {
            return -1;
          }
          if (a.start > b.start) {
            return 1;
          }
          return 0;
        }

        dates.sort(compareDates);

        // Assumes dateList is sorted.
        function lastDate(dateList, previous) {
          if (dateList.length === 0) {
            return {'start': 0, 'end': msToSec(Date.now())};
          }
          let offset = Math.max(0, dateList.length - previous);
          return dateList[offset];
        }


        // Convert input time to UNIX epoch for start time.
        $scope.changeTime = function() {
          let startDate = null;
          let endDate = null;

          // Parse time selected from drop down.
          if ($scope.time === "all-time") {
            startDate = new Date(0);
            endDate = new Date();
          } else if ($scope.time === "last-month") {
            let lastMonth = lastDate(dates, 1);
            startDate = new Date(secToMs(lastMonth.start));
            endDate = new Date(secToMs(lastMonth.end));
          } else if ($scope.time === "last-6-months") {
            startDate = new Date(secToMs(lastDate(dates, 6).start));
            endDate = new Date(secToMs(lastDate(dates, 1).end));
          } else if (!isNaN($scope.time)) { // Whole year.
            let year = parseInt($scope.time);
            startDate = new Date(year, 0, 1);
            endDate = new Date(year + 1, 0, 1);
          }
          startDate = msToSec(startDate.getTime());
          endDate = msToSec(endDate.getTime());

          let url = sessionStorage['record'] + '/fee/summary/?email=' + sessionStorage['email'] + '&start=' + startDate + '&end=' + endDate;
          console.log("REQUEST: \n", new Date(secToMs(startDate)), "\n", new Date(secToMs(endDate)), "\n", url);

          fetch(url, {
            method: "GET",
            headers: {
              "x-ersa-auth-token": sessionStorage["secret"]
            },
          })
          .then(function(response) {
            response.json().then(data => {
              $scope.chartData = parseData(data).data;

              // FIXME: How to trigger recreating the graph with new data without using $scope?
              for (let i = 0; i < $scope.chartScopes.length; i++) {
                $scope.chartScopes[i].$ctrl.updateData($scope);
              }
            })
          });
        }
      }



    });

    var menuData = {};
    // angular.config only inject providers, so we have to get the instance ourselves
    var AuthService = AuthServiceProvider.$get();
    if (AuthService.isAdmin()) {
      menuData = menuAllData.ersa;
    } else {
      menuData = menuAllData.portal;
    }
    for (var menu in menuData) {
      for (var item in menuData[menu]) {

        var details = menuData[menu][item];

        if (angular.isArray(details)) {
          var name = details[0]; // it is path, state name
          // This is a temporary solution to allow components and controllers co-exist
          // Component branch, now we have only one component.
          if (name == '/nova') {
            $stateProvider.state('/nova', {
              url: '/nova',
              template: '<nova></nova>',
              admined: true
            });
          } else {
            // FIXME: these so called external urls have to be moved into index.html: they are not mananaged states
            if (name.startsWith('http')) continue; //external url

            // controller branch
            var url = name;
            var template = "template" + name + ".html"; // /admin does not work here yet because there is no template
            var controller = details[1] + "Controller";
            var locked = name.startsWith('/admin') ? true : false;

            $stateProvider.state(name, {
              url: url,
              templateUrl: template,
              controller: controller,
              admined: locked,
              resolve: { // could use an abstract root view that does the resolve for all children but this way doesn't involve hacking state names
                orgData: resolveOrgs
              }
            });
          }
        }
      }
    }
  };
});
