define(["app", "lodash", "../util"], function(app, _, util) {
    app.controller("HPCController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {

        $scope.values = _.values;

        $scope.formatTimestamp = util.formatTimestamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
         
        $scope.rangeStart = '';
        $scope.rangeEnd = '';
        
        $scope.details = {};
        $scope.selectedQueues = {};
        $scope.allQueusSelected = false;
        $scope.alerts = []; 

        var baseFilters = function() {
            return {
                count: 25000,
                page: 1
            };
        };

        var jobSummary = {};
        $scope.selectedOrg ='';
        
        var clear = function() {
            jobSummary = {};

            $scope.status = "Zero jobs loaded.";
            $scope.jobs = [];
            $scope.jobCount = 0;
            $scope.jobSummary = []; 
        };

        clear();

        //Here it loads crm data into $scope.crm["host", "queue", "owner"]
        reporting.hpcBase(function(svc, type, data) {
            $scope[type] = util.keyArray(data);

            if (type == "queue") {
                _.forEach($scope.selectedQueues, function(q) {
                    $scope.selectedQueues[q.id] = false;
                });
            }
        });

        $scope.crm = {
            id: null,
            snapshots: [],
            snapshot: {
                "membership": [],
                "addressMapping": [],
                "usernameMapping": []
            }
        };

        function mapUser(attachTo) {
            var found = false; 
            if (angular.isDefined($scope.details)) {
                var fields = ['fullname', 'email', 'organisation'], i;  
                
                //if (attachTo.username in $scope.details) {
                if ($scope.selectedOrg != '' && attachTo.username in $scope.details[$scope.selectedOrg]) { 
                    found = true;
                    for(i = 0; i < 3; i++) {
                        attachTo[fields[i]] = $scope.details[$scope.selectedOrg][attachTo.username][fields[i]] ;
                    }
                //This else clause added by Rex, to display jobs which is not matched wiht @scope.details(extends department)
                }else{
                    if ($scope.selectedOrg == '') { 
                        var fetchOrganisations = [];
                        for(var i = 0 ; i < $scope.topOrgs.length; i++){   
                            fetchOrganisations.push($scope.topOrgs[i].pk);
                        } 
                        for(var i = 0 ; i < fetchOrganisations.length; i++){    
                            if (attachTo.username in $scope.details[fetchOrganisations[i]]) {
                                for(var j = 0; j < 3; j++) {
                                    attachTo[fields[j]] = $scope.details[fetchOrganisations[i]][attachTo.username][fields[j]] ;
                                }
                            }                 
                        }   
                        found = true; 
                    }
                }
            } else {
                $scope.error = "Data need to be loaded";
            } 
            return found;
        }

        //Here it loads crm data into $scope.crm["snapshot", "person", "organisation", "username", "email"]
        //username is packed differently
        reporting.crmBase(function(svc, type, data) {
            if (type == "username") {
                $scope.crm[type] = util.keyArray(data, "username"); 
            } else {
                $scope.crm[type] = util.keyArray(data);
            }
        });

        var selectCRM = function() {};

        var updateSummary = function(data) {
            _.forEach(data, function(job) {
                if (!(job.owner in jobSummary)) {
                    jobSummary[job.owner] = {
                        owner: job.owner,
                        username: $scope.owner[job.owner].name,
                        fullname: "",
                        organisation: "",
                        jobCount: 0,
                        cpuSeconds: 0
                    };

                    //reporting.populateFromUsername($scope.crm.id, jobSummary[job.owner]);
                }

                jobSummary[job.owner].jobCount++;
                jobSummary[job.owner].cpuSeconds += job.cpu_seconds; 
            });
        };
 
        var mapJobSummary = function() { 
            var username, swap = {};
            for (username in jobSummary) {
                if (mapUser(jobSummary[username])) {
                    swap[username] = jobSummary[username];
                };
            }
            //jobSummary = swap;
            return swap;
        }
        
        var publishJobSummary = function(_jobSummary) {
            $scope.jobSummary = _.values(_jobSummary);
        };

        $scope.export = function() {
            data = [
                ["Full Name", "Organisation", "Username", "Email", "Job Count", "Core Hours"]
            ];

            _.forEach(jobSummary, function(summary) {
                data.push([
                    summary.fullname,
                    summary.organisation,
                    summary.username,
                    summary.email,
                    summary.jobCount, 
                    (summary.cpuSeconds / 3600).toFixed(1)
                ]);
            });
            
            data.sort(function(a, b) {
                if(a[2] >= b[2]){return 1;}
                return -1; 
            });
            
            return data;
        };

        var processJobs = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {
                Array.prototype.push.apply($scope.jobs, data);
                $scope.jobCount += data.length;
                $scope.status = "Loaded " + $scope.jobCount + " jobs.";

                updateSummary(data);
                var mappedJobSummary = mapJobSummary();
                publishJobSummary(mappedJobSummary);

                var next = util.nextPage(query);
 
                reporting.hpcQuery("job", next, processJobs);
            } else {
                $scope.status = "Jobs: " + $scope.jobCount;
            }
            
            $rootScope.spinnerActive = false;
        };


        var validateJobs = function() {
            $scope.alerts = [];
            //if ($scope.selectedOrg =='') {
            //    $scope.alerts.push({type: 'danger',msg: 'Please select an Organisation!'}); 
            //    return false;
            //}
            
            if ($scope.rangeStart > $scope.rangeEnd) {
                $scope.alerts.push({type: 'danger',msg: "Start date invalid"}); 
                return false;
            }  
            return true;
        };
        
        $scope.load = function() {
            if(!validateJobs()){
                return;
            }
            
            $scope.selectedOrg = '';
            $scope.rangeStartEpoch = util.dayStart($scope.rangeStart);
            $scope.rangeEndEpoch = util.dayEnd($scope.rangeEnd);

            var query = _.merge(baseFilters(), {
                filter: [
                    "end.ge." + $scope.rangeStartEpoch,
                    "end.lt." + $scope.rangeEndEpoch
                ]
            });
            //query : {count:25000, page:1, filter:["end.ge.1459953000", "end.lt.1460039400"]}
 
            var queueQuery = []; 
            
            for (var qID in $scope.selectedQueues) {
                if ($scope.selectedQueues[qID]) {
                    queueQuery.push(qID);
                }
            }

            if (queueQuery.length == 0) {
                $scope.alerts.push({type: 'danger',msg: "Select queues!"}); 
                return false;
            }
            
            $rootScope.spinnerActive = true;
            
            query.filter.push("queue.in." + queueQuery.join(","));
            //query : {count:25000, page:1, filter:["end.ge.1459953000", "end.lt.1460039400", "queue.in.1210458a-4145-4f67-a19d-02be24a29fb6,2841930e-e8aa-4eaf-b938-ade7033e8532,32c6532e-2b34-4d06-9873-38c9cc1cddf9"]}

            clear();

            $scope.status = "Loading ...";

            reporting.hpcQuery("job", query, processJobs);
        };

        $rootScope.spinnerActive = true; 
        org.getOrganisations().then(function(data) { 
            $scope.topOrgs = data;  
            org.getAllUsers().then(function(users) {    
                $scope.details = users;    
            });  
            $rootScope.spinnerActive = false;
        });
        
        $scope.orgChanged = function() {    
            var mappedJobSummary = mapJobSummary();            
            publishJobSummary(mappedJobSummary);    
        }; 
         

        // Alert Util
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        
        // Modal Util
        $scope.animationsEnabled = true;
        $scope.openJobMessage = function (size) { 

            var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'template/hpc/hpc.html',  
            restrict: 'E',  
            controller: 'HPCController', 
            size: size,
            resolve: {
                items: function () {
                //return $scope.items;
                }
              }
            });

            modalInstance.result.then(function (selectedItem) {
                //$scope.selected = selectedItem;
                }, 
                function () {
                //console.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.toggleAnimation = function () {
            $scope.animationsEnabled = !$scope.animationsEnabled;
        }; 
        
        // cache data
        //https://www.phase2technology.com/blog/caching-json-arrays-using-cachefactory-in-angularjs-1-2-x/
 
 
        
        $scope.$on('$viewContentLoaded', function() {
            $scope.allQueusSelected = true;
            console.log('viewContentLoaded ...'); 
        });
        
        $scope.selectAllQueues = function () { 
            for (var qID in $scope.selectedQueues) { 
                $scope.selectedQueues[qID] = $scope.allQueusSelected; 
            }
        }     
        
        $scope.onChangeQueu = function (_qID) {  
            //console.log('_qID=' + _qID);  
            var allQueusSelected = true;
            for (var qID in $scope.selectedQueues) {
                if ($scope.selectedQueues[qID]) { 
                    //console.log('$scope.selectedQueues[qID]=' + $scope.selectedQueues[qID]); 
                }else{
                    allQueusSelected = false; 
                }
            }
            $scope.allQueusSelected = allQueusSelected;
        }
         
    }]);   
});
