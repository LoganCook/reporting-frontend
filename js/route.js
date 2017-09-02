define(["menu-data"], function (menuAllData) {
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
    }).state('issue-56', { // TODO#56 remove this state
      url: '/issue-56',
      templateUrl: 'template/issue-56.html', // TODO#56 delete the referenced template file
      controller: function ($scope) {
        $scope.allSchoolsRecords = [
          {
            organisation: 'School One',
            job_count: 50,
            cost: 840.6652083333332,
            month: 3
          }, {
            organisation: 'School Two',
            job_count: 259,
            cost: 5523.270791666667,
            month: 3
          }, {
            organisation: 'School Three',
            job_count: 7,
            cost: 53.43212499999999,
            month: 3
          }, {
            organisation: 'School Four',
            job_count: 1,
            cost: 66,
            month: 3
          }, {
            organisation: 'School One',
            job_count: 13,
            cost: 22.516416666666668,
            month: 4
          }, {
            organisation: 'School Two',
            job_count: 3,
            cost: 11.192499999999999,
            month: 4
          }, {
            organisation: 'School Three',
            job_count: 149,
            cost: 1141.309,
            month: 4
          }, {
            organisation: 'School One',
            job_count: 3710,
            cost: 2653.7895833333337,
            month: 5
          }, {
            organisation: 'School Two',
            job_count: 303,
            cost: 874.6545416666668,
            month: 5
          }, {
            organisation: 'School One',
            job_count: 3,
            cost: 61.35575,
            month: 6
          }, {
            organisation: 'School Three',
            job_count: 258,
            cost: 8706.824333333334,
            month: 6
          }, {
            organisation: 'School Four',
            job_count: 144,
            cost: 83,
            month: 6
          }, {
            organisation: 'School One',
            job_count: 144,
            cost: 96.08866666666665,
            month: 7
          }, {
            organisation: 'School Two',
            job_count: 7,
            cost: 155.16479166666667,
            month: 7
          }, {
            organisation: 'School Three',
            job_count: 76,
            cost: 557.5580416666667,
            month: 7
          }, {
            organisation: 'School One',
            job_count: 59,
            cost: 404.1209583333333,
            month: 8
          }, {
            organisation: 'School Three',
            job_count: 189,
            cost: 146.69391666666664,
            month: 8
          }
        ]
        $scope.allServicesRecords = [
          {
            service: 'HPC',
            cost: 840.6652083333332,
            month: 3
          }, {
            service: 'NECTAR',
            cost: 5523.270791666667,
            month: 3
          }, {
            service: 'National Storage',
            cost: 53.43212499999999,
            month: 3
          }, {
            service: 'HPC',
            cost: 22.516416666666668,
            month: 4
          }, {
            service: 'NECTAR',
            cost: 11.192499999999999,
            month: 4
          }, {
            service: 'National Storage',
            cost: 1141.309,
            month: 4
          }, {
            service: 'HPC',
            cost: 2653.7895833333337,
            month: 5
          }, {
            service: 'NECTAR',
            cost: 874.6545416666668,
            month: 5
          }, {
            service: 'National Storage',
            cost: 88,
            month: 5
          }, {
            service: 'HPC',
            job_count: 3,
            cost: 61.35575,
            month: 6
          }, {
            service: 'NECTAR',
            cost: 400,
            month: 6
          }, {
            service: 'National Storage',
            cost: 8706.824333333334,
            month: 6
          }, {
            service: 'HPC',
            cost: 96.08866666666665,
            month: 7
          }, {
            service: 'NECTAR',
            cost: 155.16479166666667,
            month: 7
          }, {
            service: 'National Storage',
            cost: 557.5580416666667,
            month: 7
          }, {
            service: 'HPC',
            cost: 404.1209583333333,
            month: 8
          }, {
            service: 'NECTAR',
            cost: 180,
            month: 8
          }, {
            service: 'National Storage',
            cost: 146.69391666666664,
            month: 8
          }
        ]
      },
      resolve: {}
    })

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