define(["app", "lodash", "../util", "properties"], function(app, _, util, props) {
    app.controller("HPCSummaryController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
         
        /**
         * 3 uni(FUSA, UOFA and UOSA) have responsiblity for paying $60,000 
         */ 
        var  totalAmountToDivided = 60000;
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
        
        $scope.userChecked = false;
        
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
            
        /**
         * Whenever user click 'Update' button, this is called  
         * to clear variable and remove stored data.
         *   
         * @return {Void}
         */ 
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
           
        /**
         * initialize all variable
         */ 
        clear();
    
        /**
         * Service names that should be requested before feching HPC data
         * This is for displaying status of current processing on the page
         * Refer to service.xfsBase in client.js.
         */     
        var serviceHpcTypes = ["host", "queue", "owner"];  
        
        /**
         * When this page is requested, this fucnction is called automatically
         * to fetch basic HPC data ("host", "queue", "owner").
         *   
         * @return {Void}
         */ 
        var initHpc = function() {            
             
            $scope.status = "Downloading "  + serviceHpcTypes; 

            $rootScope.spinnerActive = true; 
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
                 
                /**
                 * Find and remove item from serviceTypes array
                 * to display status of current processing.
                 */ 
                if(serviceHpcTypes.indexOf(type) != -1) {
                    serviceHpcTypes.splice(serviceHpcTypes.indexOf(type), 1);
                    $scope.status = "Downloading "  + serviceHpcTypes;
                }
                /**
                 * If not remained in serviceTypes array, it display "Initial data loaded."
                 */ 
                if(!serviceHpcTypes.length){
                    $rootScope.spinnerActive = false;
                    $scope.status = "Initial data loaded.";
                }   
            });
        };
 
        /**
         * When this page is requested, this fucnction is called automatically
         * to fetch CRM data (orgainsation, user details, billing organisation).
         * 
         * @return {Void}
         */ 
        org.getOrganisations().then(function(data) { 
            $scope.topOrgs = data; 
            
            org.getAllUsers().then(function(users) {    
                $scope.details = users;    
            }); 
            
            org.getBillings().then(function(billings) {    
                $scope.topOrgs = billings;
            }); 
        }); 
         
        /**
         * When this page is requested, this fucnction call initHpc
         * to fetch basic HPC data ("host", "queue", "owner"). 
         */ 
        initHpc();  
        

        /**
         * Summarize by owner
         * 
         * @param {Array} data 
         * @return {Void}
         */ 
        var updateOwnerSummary = function(data) { 
            
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
        

        /**
         * assigne user's details to each user and summarize cpuSeconds for only 3 uni
         *   
         * @return {Void}
         */ 
        var mapOrganisationJob = function() {     
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
             
            /**
             * allocate %age to only 3 uni 
             */ 
            for (uni in uniToDivide) { 
                uniToDivide[uni].cpuSeconds = uniToDivide[uni].cpuSeconds;
                if(uniToDivide[uni].cpuSeconds === 0){
                    uniToDivide[uni].cost = 0.00;
                }else{
                    uniToDivide[uni].cost = (totalAmountToDivided * (uniToDivide[uni].cpuSeconds / totalCpuSeconds).toFixed(2)).toFixed(2);
                }
            } 
        };

        /**
         * Create HPC summary data by orgainsation.
         * 3 university(University of Adelaide, Flinders University and Flinders University)
         * shoud pay $180,000.00 for their total Job hours.
         * 
         * Monthly $60,000.00 will be divied by percentage of their total Job hours. 
         * 
         * @return {Void}
         */ 
        var updateJobSummary = function() { 
             
            var username, organisations = [];
            $scope.jobCountSum = 0;
            $scope.cpuSecondsSum = 0;
            $scope.costSum = 0;
  
            var userJobSummary = _.values(jobSummary);
             
            _.forEach(userJobSummary, function(userSummary) {
                
                var _key = $scope.userChecked ? userSummary.username : userSummary.organisation;
                
                if (!(_key in organisations)) {
                    organisations[_key] = {
                        organisation: userSummary.organisation,
                        fullname: $scope.userChecked ? userSummary.fullname : "",
                        email: $scope.userChecked ? userSummary.email : "",
                        username: $scope.userChecked ? userSummary.username : "", 
                        billing : 0,
                        jobCount: 0,
                        cpuSeconds: 0,
                        cost: 0
                    };
                }
                
                /**
                 * Check if billing organisation selected
                 * if selected, remove other school summary in other billing organisation
                 */ 
                if($scope.selectedBillingOrg != '0'){ 
                    if(!userSummary.billing) {
                        delete organisations[_key];
                        return;
                    }
                    if($scope.selectedBillingOrg != userSummary.billing) {
                        delete organisations[_key];
                        return;
                    }
                } 
                 
                organisations[_key].jobCount += userSummary.jobCount;
                organisations[_key].cpuSeconds += userSummary.cpuSeconds; 
                if(userSummary.billing){ 
                    organisations[_key].billing = userSummary.billing;
                } 
                
                $scope.jobCountSum += userSummary.jobCount;
                $scope.cpuSecondsSum += userSummary.cpuSeconds; 
            });
               
            /**
             * Calulate cost for payable school in 3 university (University of Adelaide, Flinders University and Flinders University)
             */ 
            for (organisation in organisations) {
                if(organisations[organisation].billing){
                    
                    if (uniToDivide[organisations[organisation].billing]) {
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
        }
         


        /**
         * create TSV file data with summary data that has already fetched and stored.
         *  
         * @export
         * @return{Array} data
         */ 
        $scope.export = function() {
                
            var data = [
                ["School", "User ID", "User Name", "Email", "Job Count", "Total Core Hours", "$"]
            ];

            _.forEach($scope.jobSummary, function(summary) {
                data.push([ 
                    summary.organisation , 
                    summary.username , 
                    summary.fullname , 
                    summary.email , 
                    $scope.formatNumber(summary.jobCount) , 
                    $scope.formatNumber(summary.cpuSeconds / 3600), 
                    summary.cost
                ]);
            });
            
            /** Grand total data. */
            data.push([ 
                'Grand Total', 
                ' - ', 
                ' - ', 
                ' - ', 
                $scope.formatNumber($scope.jobCountSum), 
                $scope.formatNumber($scope.cpuSecondsSum / 3600),
                $scope.costSum
            ]);
            
            return data;
        };

        /**
         * Callback function for fetching HPC data.
         * When finish request HPC data, this will call updateOwnerSummary,  mapOrganisationJob 
         * and updateJobSummary function sequentially to create HPC summary data.
         *  
         * @param {String} svc - service name ('hpc')
         * @param {String} type - 'job'
         * @param {Object} query - for next query
         * @param {Array} data - fetched data
         * @return {Object} filter
         */ 
        var processJobs = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {
                Array.prototype.push.apply($scope.jobs, data);
                $scope.jobCount += data.length;
                $scope.status = "Loaded " + $scope.jobCount + " jobs."; 

                var next = util.nextPage(query);
 
                reporting.hpcQuery("job", next, processJobs);
            }else{ 
                /** Turn off loading image. */
                $rootScope.spinnerActive = false;
                $scope.status = "Jobs: " + $scope.jobCount;
                
                updateOwnerSummary($scope.jobs);
                mapOrganisationJob();
                updateJobSummary(); 
            } 
        }; 


        /**
         * create search filter for start epoch and end epoch 
         *  
         * @return{Object} filter
         */ 
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
         * Request HPC data with qeury string.
         * Queues is defined ['hpc.queues'] in properties.js
         *  
         * @export
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
            
            /**  Turn on loading image.  */
            $rootScope.spinnerActive = true; 
            query.filter.push("queue.in." + queueQuery.join(","));

            clear();

            $scope.status = "Loading ...";

            reporting.hpcQuery("job", query, processJobs);
        };
  
        
        /**
         * When user change organisation on the page, this fucnction will be called 
         * to filter data.
         *  
         * @export
         */ 
        $scope.orgChanged = function() {    
            updateJobSummary();              
        }; 
          
        /**
         * When user click a close alert button on the page, this fucnction will be called 
         * to remove warnning message.
         *  
         * @export
         */ 
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
         
        /**
         * Page onload event
         *  
         * @export
         */ 
        $scope.$on('$viewContentLoaded', function() {
            $scope.allQueusSelected = true;
            $scope.selectedBillingOrg = '0';
        }); 
         
    }]);   
});