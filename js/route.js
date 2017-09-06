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
        $scope.thousandTickFn = function (v) { return (v / 1000) + 'k' }
        $scope.terrabyteTickFn = function (v) { return (v / 1000) }
        $scope.allServicesRecords = [
          {
            "service": "HPC",
            "cost": 268.41114496346063,
            "userCount": 10.536379638399493,
            "organisation": "School A",
            "month": 3,
            "allocated": 998.7848221748712,
            "used": 599.2986433902463
          },
          {
            "service": "HPC",
            "cost": 572.2540633698726,
            "userCount": 22.46362036160051,
            "organisation": "School B",
            "month": 3,
            "allocated": 379.34850127127874,
            "used": 228.67282320450713
          },
          {
            "service": "NECTAR",
            "cost": 4878.325549798872,
            "userCount": 11.482006683986729,
            "organisation": "School A",
            "month": 3,
            "allocated": 693.7585218806332,
            "used": 175.53883215687608
          },
          {
            "service": "NECTAR",
            "cost": 644.9452418677948,
            "userCount": 1.517993316013272,
            "organisation": "School B",
            "month": 3,
            "allocated": 612.1881421562784,
            "used": 521.4879286641664
          },
          {
            "service": "National Storage",
            "cost": 7.117662326742368,
            "userCount": 0.2952094411482564,
            "organisation": "School A",
            "month": 3,
            "allocated": 335.9307388526989,
            "used": 325.6245363189878
          },
          {
            "service": "National Storage",
            "cost": 523.3144626732577,
            "userCount": 21.704790558851744,
            "organisation": "School B",
            "month": 3,
            "allocated": 8.639553209052409,
            "used": 0.4900176381632093
          },
          {
            "service": "HPC",
            "cost": 15.866423130707178,
            "userCount": 26.777088374787553,
            "organisation": "School A",
            "month": 4,
            "allocated": 708.7297553786958,
            "used": 235.46269897298302
          },
          {
            "service": "HPC",
            "cost": 6.649993535959491,
            "userCount": 11.222911625212447,
            "organisation": "School B",
            "month": 4,
            "allocated": 209.85524452622028,
            "used": 85.22899142492528
          },
          {
            "service": "NECTAR",
            "cost": 0.055933376758413464,
            "userCount": 0.11494015326723339,
            "organisation": "School A",
            "month": 4,
            "allocated": 904.7371187965964,
            "used": 390.3317894027852
          },
          {
            "service": "NECTAR",
            "cost": 11.136566623241585,
            "userCount": 22.885059846732766,
            "organisation": "School B",
            "month": 4,
            "allocated": 315.5994742849975,
            "used": 76.84418627717679
          },
          {
            "service": "National Storage",
            "cost": 578.4442779832741,
            "userCount": 15.71158434523998,
            "organisation": "School A",
            "month": 4,
            "allocated": 211.61370568152728,
            "used": 130.84378107123342
          },
          {
            "service": "National Storage",
            "cost": 562.8647220167259,
            "userCount": 15.28841565476002,
            "organisation": "School B",
            "month": 4,
            "allocated": 96.9712237149769,
            "used": 65.68867461207353
          },
          {
            "service": "HPC",
            "cost": 575.9948707017764,
            "userCount": 10.852308606515237,
            "organisation": "School A",
            "month": 5,
            "allocated": 847.8353295856514,
            "used": 646.766342326765
          },
          {
            "service": "HPC",
            "cost": 2077.794712631557,
            "userCount": 39.14769139348476,
            "organisation": "School B",
            "month": 5,
            "allocated": 810.5848583947079,
            "used": 512.597687498784
          },
          {
            "service": "NECTAR",
            "cost": 629.0631310392292,
            "userCount": 20.137970855939457,
            "organisation": "School A",
            "month": 5,
            "allocated": 356.87129454990065,
            "used": 88.89230194993623
          },
          {
            "service": "NECTAR",
            "cost": 245.5914106274375,
            "userCount": 7.862029144060543,
            "organisation": "School B",
            "month": 5,
            "allocated": 64.00262486416896,
            "used": 11.538396460426398
          },
          {
            "service": "National Storage",
            "cost": 471.5059092928474,
            "userCount": 1.7681471598481777,
            "organisation": "School A",
            "month": 5,
            "allocated": 465.13471507959457,
            "used": 285.2223213148426
          },
          {
            "service": "National Storage",
            "cost": 8328.494090707152,
            "userCount": 31.231852840151824,
            "organisation": "School B",
            "month": 5,
            "allocated": 515.6902197923259,
            "used": 487.4203712289239
          },
          {
            "service": "HPC",
            "cost": 7.906860123100287,
            "userCount": 4.252680214361481,
            "organisation": "School A",
            "month": 6,
            "allocated": 83.29987536994277,
            "used": 3.638645557370225
          },
          {
            "service": "HPC",
            "cost": 53.44888987689971,
            "userCount": 28.747319785638517,
            "organisation": "School B",
            "month": 6,
            "allocated": 928.1627604667981,
            "used": 662.6988163236284
          },
          {
            "service": "NECTAR",
            "cost": 59.36451849195059,
            "userCount": 9.795145551171847,
            "organisation": "School A",
            "month": 6,
            "allocated": 969.4176931317693,
            "used": 294.77154779896375
          },
          {
            "service": "NECTAR",
            "cost": 340.6354815080494,
            "userCount": 56.20485444882815,
            "organisation": "School B",
            "month": 6,
            "allocated": 559.6730818682909,
            "used": 59.49293859092427
          },
          {
            "service": "National Storage",
            "cost": 3692.568575404839,
            "userCount": 24.597829148057233,
            "organisation": "School A",
            "month": 6,
            "allocated": 412.03234366408117,
            "used": 127.30796340099744
          },
          {
            "service": "National Storage",
            "cost": 5014.255757928495,
            "userCount": 33.40217085194276,
            "organisation": "School B",
            "month": 6,
            "allocated": 805.0380363878236,
            "used": 259.3364518577845
          },
          {
            "service": "HPC",
            "cost": 23.33675396596422,
            "userCount": 21.372284789099496,
            "organisation": "School A",
            "month": 7,
            "allocated": 734.5732644577805,
            "used": 384.9187779768046
          },
          {
            "service": "HPC",
            "cost": 72.75191270070243,
            "userCount": 66.6277152109005,
            "organisation": "School B",
            "month": 7,
            "allocated": 149.64741805212657,
            "used": 142.15019600977928
          },
          {
            "service": "NECTAR",
            "cost": 92.47145335675114,
            "userCount": 26.22208236800101,
            "organisation": "School A",
            "month": 7,
            "allocated": 431.82774419772585,
            "used": 363.6807763312071
          },
          {
            "service": "NECTAR",
            "cost": 62.69333830991553,
            "userCount": 17.77791763199899,
            "organisation": "School B",
            "month": 7,
            "allocated": 41.2882604193221,
            "used": 35.34754404726216
          },
          {
            "service": "National Storage",
            "cost": 257.3082097554301,
            "userCount": 36.91930748393876,
            "organisation": "School A",
            "month": 7,
            "allocated": 461.16614365486555,
            "used": 207.45998721410922
          },
          {
            "service": "National Storage",
            "cost": 300.2498319112366,
            "userCount": 43.08069251606124,
            "organisation": "School B",
            "month": 7,
            "allocated": 409.69706718086263,
            "used": 72.12485283394449
          },
          {
            "service": "HPC",
            "cost": 218.6141308646693,
            "userCount": 54.63717424702138,
            "organisation": "School A",
            "month": 8,
            "allocated": 340.0372395186568,
            "used": 160.30664697866104
          },
          {
            "service": "HPC",
            "cost": 185.506827468664,
            "userCount": 46.36282575297862,
            "organisation": "School B",
            "month": 8,
            "allocated": 760.3002204635753,
            "used": 342.108087124857
          },
          {
            "service": "NECTAR",
            "cost": 20.22816706960929,
            "userCount": 3.596118590152763,
            "organisation": "School A",
            "month": 8,
            "allocated": 583.0080430298657,
            "used": 184.9364362117491
          },
          {
            "service": "NECTAR",
            "cost": 159.7718329303907,
            "userCount": 28.403881409847237,
            "organisation": "School B",
            "month": 8,
            "allocated": 201.8999992859385,
            "used": 148.41531274600788
          },
          {
            "service": "National Storage",
            "cost": 65.55763347158457,
            "userCount": 17.42913246499178,
            "organisation": "School A",
            "month": 8,
            "allocated": 110.51188453184113,
            "used": 15.578588522406335
          },
          {
            "service": "National Storage",
            "cost": 81.13628319508207,
            "userCount": 21.57086753500822,
            "organisation": "School B",
            "month": 8,
            "allocated": 905.4653818900887,
            "used": 428.6753275160777
          }
        ]
        // $scope.allServicesRecords.push({
        //   'service': 'New service',
        //   'cost': Math.random() * 1000,
        //   'userCount': Math.random() * 10,
        //   'organisation': 'School C',
        //   'month': 3
        // })
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