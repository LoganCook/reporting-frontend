define(["app", "lodash", "../util", "properties"], function(app, _, util, props) {
    app.controller("HPCSummaryController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
        
        //3 uni(FUSA, UOFA and UOSA) have responsiblity for paying $180,000 
        var  totalAmountToDivided = 180000;
        var  uniToDivide = {};
        
        $scope.values = _.values; 
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
        $scope.costSum = 0;
            
        var clear = function() {
            jobSummary = {};

            $scope.status = "Zero jobs loaded.";
            $scope.jobs = [];
            $scope.jobCount = 0;
            $scope.jobSummary = []; 
            
            uniToDivide = {4 :{ name:'University of Adelaide', jobCount : 0, cpuSeconds : 0, cost :0}, 
                           11:{ name:'Flinders University', jobCount : 0, cpuSeconds : 0, cost :0}, 
                           20:{ name:'Flinders University', jobCount : 0, cpuSeconds : 0, cost :0}};
            
            $scope.jobCountSum = 0;
            $scope.cpuSecondsSum = 0;
            $scope.costSum = 0;
        }; 
           
        clear();

        //Here it loads hpc base data         
        var serviceHpcTypes = ["host", "queue", "owner"];  
        var initHpc = function() {            
             
            $scope.status = "Downloading "  + serviceHpcTypes;
                
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
                
                // Find and remove item from serviceTypes array
                if(serviceHpcTypes.indexOf(type) != -1) {
                    serviceHpcTypes.splice(serviceHpcTypes.indexOf(type), 1);
                    $scope.status = "Downloading "  + serviceHpcTypes;
                }
                if(!serviceHpcTypes.length){
                    $rootScope.spinnerActive = false;
                    $scope.status = "Initial data loaded.";
                }   
            });
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
        }); 
         
        initHpc();  
        

        var updateSummary = function(data) {
            //summarize by user
            _.forEach(data, function(job) {
                if (!(job.owner in jobSummary)) {
                    jobSummary[job.owner] = {
                        owner: job.owner,
                        username: $scope.owner[job.owner].name,
                        fullname: "",
                        email:"",
                        organisation: "",
                        jobCount: 0,
                        cpuSeconds: 0
                    };
                 }
                 
                 jobSummary[job.owner].jobCount++;
                 jobSummary[job.owner].cpuSeconds += job.cpu_seconds; 
            }); 
        };
        

        var updateOrganisationSummary = function() {        
            //assigne user's details to each user
            //and summarize cpuSeconds for only 3 uni
            var userAccountMap = {}; 
            var totalCpuSeconds = 0; 
          
            _.forEach($scope.topOrgs, function(org) {
                _.extend(userAccountMap, $scope.details[org.pk]);   
            }); 
            
            for (owner in jobSummary) { 
                if (userAccountMap[jobSummary[owner].username]) {
                    jobSummary[owner].fullname = userAccountMap[jobSummary[owner].username].fullname;
                    jobSummary[owner].email = userAccountMap[jobSummary[owner].username].email;
                    jobSummary[owner].billing = userAccountMap[jobSummary[owner].username].billing; 
                    jobSummary[owner].organisation = userAccountMap[jobSummary[owner].username].organisation;
                };
                
                if (uniToDivide[jobSummary[owner].billing]) {
                    uniToDivide[jobSummary[owner].billing].cpuSeconds += jobSummary[owner].cpuSeconds * 1;
                    uniToDivide[jobSummary[owner].billing].jobCount += jobSummary[owner].jobCount * 1;
                    totalCpuSeconds += jobSummary[owner].cpuSeconds * 1;
                }
            }
             
            //allocation %age to each uni 
            for (uni in uniToDivide) { 
                uniToDivide[uni].cpuSeconds = uniToDivide[uni].cpuSeconds;
                if(uniToDivide[uni].cpuSeconds === 0){
                    uniToDivide[uni].cost = 0.00;
                }else{
                    uniToDivide[uni].cost = (totalAmountToDivided * (uniToDivide[uni].cpuSeconds / totalCpuSeconds).toFixed(2)).toFixed(2);
                }
            } 
        };
 
        var mapJobSummary = function() { 
             
            var username, organisations = [];
            $scope.jobCountSum = 0;
            $scope.cpuSecondsSum = 0;
            $scope.costSum = 0;
  
            var userJobSummary = _.values(jobSummary);
             
            _.forEach(userJobSummary, function(userSummary) {
                if (!(userSummary.organisation in organisations)) {
                    organisations[userSummary.organisation] = {
                        organisation: userSummary.organisation,
                        billing : 0,
                        jobCount: 0,
                        cpuSeconds: 0,
                        cost: 0
                    };
                }

                if($scope.selectedBillingOrg != '0'){
                    
                    if(!userSummary.billing) {
                        delete organisations[userSummary.organisation];
                        return;
                    }
                    if($scope.selectedBillingOrg != userSummary.billing) {
                        delete organisations[userSummary.organisation];
                        return;
                    }
                } 
                 
                organisations[userSummary.organisation].jobCount += userSummary.jobCount;
                organisations[userSummary.organisation].cpuSeconds += userSummary.cpuSeconds; 
                if(userSummary.billing){ 
                    organisations[userSummary.organisation].billing = userSummary.billing;
                } 
                
                $scope.jobCountSum += userSummary.jobCount;
                $scope.cpuSecondsSum += userSummary.cpuSeconds; 
            });
              
            //calulate cost
            
            for (organisation in organisations) {
                if(organisations[organisation].billing){
                    
                    if (uniToDivide[organisations[organisation].billing]) {// payable organisation  
                        if(uniToDivide[organisations[organisation].billing].cpuSeconds === 0){
                            organisations[organisation].cost = 0.00  + "";
                        }else{
                            organisations[organisation].cost = (uniToDivide[organisations[organisation].billing].cost * (organisations[organisation].cpuSeconds / uniToDivide[organisations[organisation].billing].cpuSeconds).toFixed(4)).toFixed(2);
                        }
                        
                        $scope.costSum += organisations[organisation].cost * 1; 
                    }  
                } 
            }  
            
            $scope.jobSummary = _.values(organisations);
            return organisations; 
        }
         
 
        $scope.export = function() {
                
            var data = [
                ["School", "Job Count", "Total Core Hours", "$"]
            ];

            _.forEach($scope.jobSummary, function(summary) {
                data.push([ 
                    summary.organisation , 
                    $scope.formatNumber(summary.jobCount) , 
                    $scope.formatNumber(summary.cpuSeconds / 3600), 
                    summary.cost
                ]);
            });
            
            data.push([ 
                'Grand Total', 
                $scope.formatNumber($scope.jobCountSum), 
                $scope.formatNumber($scope.cpuSecondsSum / 3600),
                $scope.costSum
            ]);
            
            return data;
        };

        var processJobs = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {
                Array.prototype.push.apply($scope.jobs, data);
                $scope.jobCount += data.length;
                $scope.status = "Loaded " + $scope.jobCount + " jobs."; 

                var next = util.nextPage(query);
 
                reporting.hpcQuery("job", next, processJobs);
            }else{
                $scope.status = "Jobs: " + $scope.jobCount;
                $rootScope.spinnerActive = false;
                
                updateSummary($scope.jobs);
                updateOrganisationSummary();
                mapJobSummary(); 
            } 
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
            $scope.selectedBillingOrg = '0'; 

            var query = _.merge(baseFilters(), getSearchDateFilter());

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

            clear();

            $scope.status = "Loading ...";

            reporting.hpcQuery("job", query, processJobs);
        };
  
        
        $scope.orgChanged = function() {    
            mapJobSummary();              
        }; 
          
        // Alert Util
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
         
        $scope.$on('$viewContentLoaded', function() {
            $scope.allQueusSelected = true;
            $scope.selectedBillingOrg = '0';
            console.log('viewContentLoaded ...'); 
        }); 
         
    }]);   
});
