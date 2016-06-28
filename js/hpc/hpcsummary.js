define(["app", "lodash", "../util", "properties"], function(app, _, util, props) {
    app.controller("HPCSummaryController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {

        $scope.values = _.values;

        /**
         * Below 3 variables is used in vew list.
         */
        $scope.formatTimestamp = util.formatTimestamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration; 
        
        $scope.topOrgs = []; 
        
        $scope.details = {};
        $scope.selectedQueues = {};
        $scope.allQueusSelected = false;
        $scope.alerts = []; 
        
        $scope.rangeStart  =  new Date();
        $scope.rangeEnd =  new Date();
        $scope.rangeEndOpen = false;
        $scope.openRangeEnd = function() {
            $scope.rangeEndOpen = true;
        }; 
        
        var baseFilters = function() {
            return {
                count: 25000,
                page: 1
            };
        };

        var jobSummary = {};
        $scope.selectedBillingOrg ='0';
        
        $scope.jobCountSum = 0;
        $scope.cpuSecondsSum = 0;
            
        var clear = function() {
            jobSummary = {};

            $scope.status = "Zero jobs loaded.";
            $scope.jobs = [];
            $scope.jobCount = 0;
            $scope.jobSummary = []; 
            
            $scope.jobCountSum = 0;
            $scope.cpuSecondsSum = 0;
        };
 
           
        clear();

        //Here it loads crm data into $scope.crm["host", "queue", "owner"]
        reporting.hpcBase(function(svc, type, data) {

            if (type == "queue") {  
                var filtered = [];
                if(props['hpc.queues']){   
                    _.forEach(data, function(_queu) {
                        if(props['hpc.queues'].indexOf(_queu.name) > -1){
                            filtered.push(_queu);
                        } 
                    });     
                }else{
                    filtered = data;
                }
                
                $scope[type] = util.keyArray(filtered);  
            }else{ 
                $scope[type] = util.keyArray(data);
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
                var fields = ['organisation'];   
                var fetchOrganisations = [];
                
                for(var i = 0 ; i < $scope.topOrgs.length; i++){
                    if ($scope.selectedBillingOrg == '0') { 
                        fetchOrganisations.push($scope.topOrgs[i].pk);
                    }else{
                        if($scope.selectedBillingOrg == $scope.topOrgs[i].billing){
                            fetchOrganisations.push($scope.topOrgs[i].pk);     
                        }
                    }
                } 
                
                //if (attachTo.username in $scope.details) {
                if ($scope.selectedBillingOrg != '0'){
                    for(var i = 0 ; i < fetchOrganisations.length; i++){  
                        if(attachTo.username in $scope.details[fetchOrganisations[i]]) { 
                            found = true;                        
                            for(i = 0; i < 1; i++) {
                                attachTo[fields[i]] = $scope.details[fetchOrganisations[i]][attachTo.username][fields[i]] ;
                            }
                        }
                    }
                //This else clause added by Rex, to display jobs which is not matched wiht @scope.details(extends department)
                }else{ 
                    for(var i = 0 ; i < fetchOrganisations.length; i++){    
                        if (attachTo.username in $scope.details[fetchOrganisations[i]]) {
                            for(var j = 0; j < 1; j++) {
                                attachTo[fields[j]] = $scope.details[fetchOrganisations[i]][attachTo.username][fields[j]] ;
                            }
                        }                 
                    }   
                    found = true; 
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
            var username, swap = {}, organisations = [];
            $scope.jobCountSum = 0;
            $scope.cpuSecondsSum = 0;
            
            for (username in jobSummary) {
                // every user has their own organisation
                if (mapUser(jobSummary[username])) {
                    swap[username] = jobSummary[username];
                };
            } 
            //return swap;


            // Map to Array, because it don't need username as key
            swap = _.values(swap); 
            _.forEach(swap, function(orgSummary) {
                if (!(orgSummary.organisation in organisations)) {
                    organisations[orgSummary.organisation] = {
                        organisation: orgSummary.organisation,
                        jobCount: 0,
                        cpuSeconds: 0
                    };
                }

                organisations[orgSummary.organisation].jobCount += orgSummary.jobCount;
                organisations[orgSummary.organisation].cpuSeconds += orgSummary.cpuSeconds; 
                $scope.jobCountSum += orgSummary.jobCount;
                $scope.cpuSecondsSum += orgSummary.cpuSeconds;
            });
              
            return organisations; 
        }
        
        var publishJobSummary = function(_jobSummary) {
            $scope.jobSummary = _.values(_jobSummary);
        };

        /**
         * This function is called from _export() in ersa-search directive
         */
        $scope.export = function() {
                
            var data = [
                ["School", "Job Count", "Total Core Hours", "Total Core Duration", "Mean Core Duration"]
            ];

            _.forEach($scope.jobSummary, function(summary) {
                data.push([ 
                    summary.organisation, 
                    summary.jobCount, 
                    (summary.cpuSeconds / 3600).toFixed(1)
                ]);
            });
            
            data.push([ 
                'Grand Total', 
                $scope.jobCountSum, 
                ($scope.cpuSecondsSum / 3600).toFixed(1)
            ]);
            
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
            //if ($scope.selectedBillingOrg =='0') {
            //    $scope.alerts.push({type: 'danger',msg: 'Please select an Organisation!'}); 
            //    return false;
            //}
             
            return true;
        };

        var getSearchDateFilter = function() {
            
            $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
            $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd); 
              
            var rangeStartEpoch = util.dayStart($scope.rangeStart);
            var rangeEndEpoch = util.dayEnd($scope.rangeEnd);
            
            var filter =  {
                    filter: [
                        "end.ge." + rangeStartEpoch,
                        "end.lt." + rangeEndEpoch
                    ]
                }; 
            return filter;
        };
                
        /**
         * This function is called from _load() in ersa-search directive
         * arg : rangeEpochFilter - filter:["end.ge.1459953000", "end.lt.1460039400"]
         */        
        $scope.load = function() {
            if(!validateJobs()){
                return;
            }
            
            $scope.selectedBillingOrg = '0'; 

            var query = _.merge(baseFilters(), getSearchDateFilter());
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
            
            org.getBillings().then(function(billings) {    
                $scope.topOrgs = billings;
            });
            
            $rootScope.spinnerActive = false;
        });
        
        $scope.orgChanged = function() {    
            //console.info('$scope.selectedBillingOrg : ' + $scope.selectedBillingOrg);
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
            $scope.selectedBillingOrg = '0';
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
