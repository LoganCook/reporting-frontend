define(["app", "lodash", "mathjs","../util"], function(app, _, math, util) {
    app.controller("HPCStorageController", ["$rootScope", "$scope", "$timeout", "$filter","reporting", "org", "spinner",
    function($rootScope, $scope, $timeout, $filter, reporting, org, spinner) {

        $scope.values = _.values;

        $scope.formatTimestamp = util.formatTimestamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.formatSize = util.formatSize;
        $scope.basename = util.basename;
        $scope.Math = window.Math;
 
        $scope.total = {};
        $scope.topOrgs = [];
        $scope.details = {};

        $scope.selectedBillingOrg = '0';
        
        $scope.peak = 0;
        $scope.usageSum = 0;
                 
        $scope.alerts = [];
        $scope.select = {
            host: null,
            crm: null,
            snapshot: null,
            filesystem: null
        };
 
        $scope.xfs = {};

        $scope.output = {
            usage: [],
            summed: []
        };
        
        $scope.userChecked = false;        
        $scope.loggedInAsErsaUser = sessionStorage['ersaUser'] === 'true' ? true : false ;
       
        $scope.rangeStart  =  new Date();
        $scope.rangeEnd =  new Date();
        $scope.rangeEndOpen = false;
        $scope.openRangeEnd = function() {
            $scope.rangeEndOpen = true;
        };
        
        var baseQuery = function() {
            return {
                count: 80000,
                page: 1
            };
        };

        var xfs = {};

        /**
         * Whenever user click 'Update' button, this is called  
         * to clear variable and remove stored data.
         *   
         * @return {Void}
         */ 
        var clear = function() {
            $scope.raw = [];
            $scope.output.usage = [];
            $scope.output.summed = [];
            
            $scope.userChecked = false;

            $scope.status = "No data loaded.";
        };

        /**
         * initialize all variable
         */ 
        clear();
                 
        /**
         * Service names that should be requested before feching XFS data
         * This is for displaying status of current processing on the page.
         * Refer to service.xfsBase in client.js.
         */      
        var serviceTypes = ["snapshot", "host", "filesystem", "owner"];


        /**
         * When this page is requested, this fucnction is called automatically
         * to fetch basic XFS data ("snapshot", "host", "filesystem", "owner").
         *   
         * @return {Void}
         */         
        var initXFS = function() {
            
            if (!_.isEmpty($scope.xfs) && !_.isEmpty($scope.xfs.snapshotByTimestamp) &&
                    !_.isEmpty(xfs) && !_.isEmpty(xfs.owner) &&
                    $scope.select.host !== null && $scope.select.filesystem !== null) {
                return;
            }
            
            spinner.start();

            $scope.status = "Downloading "  + serviceTypes;
                
            reporting.xfsBase(function(svc, type, data) {
                
                xfs[type] = $scope.xfs[type] = util.keyArray(data);

                if (type == "snapshot") {
                    xfs.snapshotByTimestamp = $scope.xfs.snapshotByTimestamp = util.keyArray(data, "ts");
                } else if (type == "host" && data.length) {
                    
                    /** host pl-cml-nss-01.blue.ersa.edu.au is default */                    
                    $scope.select.host = data[0].id; 
                } else if (type == "filesystem" && data.length) {
                    _.forEach(data, function(record) {

                        /** 
                         * This summary is for only '/export/compellent/hpchome' filesystem. 
                         */                        
                        if (record.name.endsWith('/hpchome')) {
                            $scope.select.filesystem = record.id; 
                        }
                    });
                }
                
                /**
                 * Find and remove item from serviceTypes array
                 * to display status of current processing.
                 */ 
                if (serviceTypes.indexOf(type) != -1) {
                    serviceTypes.splice(serviceTypes.indexOf(type), 1);
                    $scope.status = "Downloading "  + serviceTypes;
                }
                /**
                 * If not remained in serviceTypes array, it display "Initial data loaded."
                 */ 
                if (!serviceTypes.length) { 
                    spinner.stop();
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
         * to fetch basic HPC data ("snapshot", "host", "filesystem", "owner"). 
         */        
        initXFS();
         
        /**
         * Calculate grand total usage data. 
         *   
         * @param {Array}data  
         * @return {Array} data  
         */ 
        var summarizeStorage = function(data) {
            _.forEach(data, function(entry) {
                if (entry.usage && entry.usage > (1024 * 1024) + 1) {
                    entry.usage  = (entry.usage / (1024 * 1024)).toFixed(2);
                    entry.quota250 = 250 * (window.Math.ceil(entry.usage / 250));
                    entry.per5dollar = 5 * (window.Math.ceil(entry.usage / 250));
                } else {
                    entry.usage  = 0;
                    entry.quota250 = 0;
                    entry.per5dollar = 0;
                }
                $scope.total.currentUsage += entry.usage * 1;
                $scope.total.quota250 += entry.quota250  * 1 ;
                $scope.total.per5dollar += entry.per5dollar * 1 ;
            });
             
            return data;
        };

        /**
         * Create XFS summary data by owner or scholl based.  
         * 
         * @return {Void}
         */  
        var updateSummary  = function() {

            if ($scope.raw.length === 0) {
                return;
            }

            var t1 = util.dayStart($scope.rangeStart);
            var t2 = util.dayEnd($scope.rangeEnd);

            var weights = util.durationWeight(t1, t2, $scope.select.timestamps);

            var userAccountMap = {};
            /** creat map for all user account */
            _.forEach ($scope.topOrgs, function(_org) {
                if ($scope.selectedBillingOrg == '0') {
                    _.extend(userAccountMap, $scope.details[_org.pk]);
                } else {
                    if ($scope.selectedBillingOrg == _org.billing) {
                        _.extend(userAccountMap, $scope.details[_org.pk]);
                    }
                }
            });
                        
            var topOrganisations =  util.keyArray($scope.topOrgs,  "pk"); 
            
            /** clear cached memory */ 
            var summed = {};
            $scope.total.currentUsage = 0;
            $scope.total.quota250 = 0;
            $scope.total.per5dollar = 0;
                        
            _.forEach($scope.raw, function(record) {
                var _sumeKey = record.owner;
                
                if (!(_sumeKey in summed)) {
                    summed[_sumeKey] = {
                        fullname: xfs.owner[record.owner].fullname,
                        email: xfs.owner[record.owner].email,
                        username: xfs.owner[record.owner].name,
                        school: "",
                        organisation: "",
                        usage: 0
                    };
                    
                    if (summed[_sumeKey].username in userAccountMap) {
                        summed[_sumeKey].fullname = userAccountMap[summed[_sumeKey].username].fullname;
                        summed[_sumeKey].email = userAccountMap[summed[_sumeKey].username].email;
                        summed[_sumeKey].school = userAccountMap[summed[_sumeKey].username].organisation;
                        summed[_sumeKey].organisation = topOrganisations[userAccountMap[summed[_sumeKey].username].billing].fields.name;
                    }
                }
                
                /**
                 * Check if billing organisation selected
                 * if selected, remove other school summary in other billing organisation
                 */ 
                if ($scope.selectedBillingOrg != '0' && !summed[_sumeKey].school ) {
                    delete summed[_sumeKey];
                    return;
                }
                 
                var recordUsage = record.usage; 
                var userSum = summed[_sumeKey]; 
                var snapshot = $scope.xfs.snapshot[record.snapshot]; 
                var weightedUsage = weights[snapshot.ts] * recordUsage; 
                userSum.usage += weightedUsage ; 
            }); 
             
            if ($scope.userChecked) {
                $scope.output.summed = _.values(summed);
                $scope.output.summed = summarizeStorage($scope.output.summed);
                
                return;
            }
            
            // clear memory
            userAccountMap = {};
            var summedBySchool = {};
      
            _.forEach(summed, function(entry) {
                var _school = entry.school ? entry.school : '-';
                if (!(_school in summedBySchool)) {
                    summedBySchool[_school] = {
                        organisation : entry.organisation,
                        school: _school,
                        username: '', 
                        usage: 0,
                        quota250 : 0,
                        per5dollar : 0
                    };
                }

                summedBySchool[_school].usage += entry.usage;
                summedBySchool[_school].quota250 = 250 * (window.Math.ceil(entry.usage / 250));
                summedBySchool[_school].per5dollar = 5 * (window.Math.ceil(entry.usage / 250));
            });
            
            $scope.output.summed = _.values(summedBySchool);
            $scope.output.summed = summarizeStorage($scope.output.summed);
        }; 


        /**
         * create TSV file data with summary data that has already fetched and stored.
         *  
         * @export
         * @return{Array} data
         */ 
        $scope.export = function() {
            var records = [];
            var data = [];

            if ($scope.loggedInAsErsaUser) {
                _.forEach($scope.output.summed, function(entry) {
                    records.push([
                        entry.organisation,
                        entry.school,
                        entry.username,
                        entry.fullname,
                        entry.email,
                        entry.usage,
                        entry.quota250,
                        '$' + $scope.formatNumber(entry.per5dollar) + '.00'
                    ]);
                });
            
                records = $filter('orderBy')(records, [0, 1]);
                
                data = [
                    ["Organisation", "School", "User ID", "User Name", "Email","Total GB Used", "250GB Quota Allocated", "Cost per Quota"]
                ];
            
                Array.prototype.push.apply(data, records) ;
                
                /** Grand total data. */
                data.push([
                    'Grand Total',
                    ' - ',
                    ' - ',
                    ' - ',
                    ' - ',
                    $scope.total.currentUsage.toFixed(2),
                    $scope.total.quota250,
                    '$' + $scope.formatNumber($scope.total.per5dollar) + '.00'
                ]);
                           
            } else {       
                _.forEach($scope.output.summed, function(entry) {
                    records.push([
                        entry.school,
                        entry.username,
                        entry.fullname,
                        entry.email,
                        entry.usage,
                        entry.quota250,
                        '$' + $scope.formatNumber(entry.per5dollar) + '.00'
                    ]);
                });
            
                records = $filter('orderBy')(records, [0, 1]);
                
                data = [
                    ["School", "User ID", "User Name", "Email","Total GB Used", "250GB Quota Allocated", "Cost per Quota"]
                ];
            
                Array.prototype.push.apply(data, records) ;
                
                /** Grand total data. */
                data.push([
                    'Grand Total',
                    ' - ',
                    ' - ',
                    ' - ',
                    $scope.total.currentUsage.toFixed(2),
                    $scope.total.quota250,
                    '$' + $scope.formatNumber($scope.total.per5dollar) + '.00'
                ]);                       
            } 
            return data;
        };
       
        /**
         * Callback function for fetching  in '/export/compellent/hpchome' host of XFS data.
         * When finish request HPC data, this will call updateOwnerSummary,  mapOrganisationJob 
         * and updateJobSummary function sequentially to create HPC summary data.
         *  
         * @param {String} svc - service name ('hpc')
         * @param {String} type - 'job'
         * @param {Object} query - for next query
         * @param {Array} data - fetched data
         * @return {Object} filter
         */ 
        var processUsageRange = function(svc, type, query, data) {
            if (data && data.length > 0) {
                Array.prototype.push.apply($scope.raw, data);

                $scope.status = "Loaded " + $scope.raw.length + " usage records.";

                var next = util.nextPage(query);

                reporting.xfsQuery("usage", next, processUsageRange);
            } else { 
                spinner.stop();
                $scope.status = "Usage records: " + $scope.raw.length + ". Snapshots: " + $scope.select.snapshots.length + ".";
                
                updateSummary();
            }
        };
 
        /**
         * Request XFS data with qeury string. 
         *  
         * @export
         */ 
        $scope.load = function(rangeEpochFilter) {
            clear();
            
            initXFS();
           
            if (rangeEpochFilter) { 
                /** rangeEpochFilter not used because this function use ts.ge and ts.lt */
            }
            
            $scope.alerts = [];
            $scope.selectedBillingOrg = '0';

            if (!(xfs['snapshot'])) {
                $scope.alerts.push({type: 'danger',msg: "Snapshot isn't loaded!"});
                return false;
            }
                
            if (!(xfs['owner'])) {
                $scope.alerts.push({type: 'danger',msg: "Owner isn't loaded!"});
                return false;
            }
            if (!$scope.topOrgs) {
                $scope.alerts.push({type: 'danger',msg: "Orgainsation isn't loaded!"});
                return false;
            }
            
            if (!($scope.select.host)) {
                $scope.alerts.push({type: 'danger',msg: "Host isn't loaded!"});
                return false;
            }
            
            /**
             * Filter filesystems data to fetch
             * what is related with only 'pl-cml-nss-01.blue.ersa.edu.au' host.  
             */                
            if ($scope.select.host) {
                ["snapshot"].forEach(function(type) {
                    $scope.xfs[type] = {};
                    for (var key in xfs[type]) {
                        if (xfs[type][key].host == $scope.select.host) {
                            $scope.xfs[type][key] = xfs[type][key];
                        }
                    }
                });
            }
            
            $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
            $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd);
              
            var t1 = util.dayStart($scope.rangeStart);
            var t2 = util.dayEnd($scope.rangeEnd);

            var snapshots = _.filter(_.values($scope.xfs.snapshot), function(snapshot) {
                return (snapshot.ts >= t1) && (snapshot.ts < t2);
            });
  
            snapshots.sort(function(s1, s2) {
                if (s1.id > s2.id) {
                    return 1;
                } else if (s1.id < s2.id) {
                    return -1;
                } else {
                    return 0;
                }
            }); 

            var timestamps = snapshots.map(function(s) { return s.ts; });

            var earlierSnapshots = _.values($scope.xfs.snapshot).filter(function(s) {
                return s.ts < t1;
            });

            if (earlierSnapshots.length > 0) {
                earlierSnapshots = util.keyArray(earlierSnapshots, "ts");

                var ts = math.max(_.keys(earlierSnapshots).map(function(i) { return parseInt(i); }));

                snapshots.push(earlierSnapshots[ts]);
                timestamps.push(ts);
            }

            $scope.select.snapshots = snapshots;
            $scope.select.timestamps = math.sort(timestamps);

            if (snapshots.length === 0) {
                $scope.status = "No snapshots in that range.";
                return;
            }

            var query = baseQuery();

            query.filter = [
                "snapshot.in." + snapshots.map(function(s) { return s.id; }).join(","),
                "filesystem.in." + $scope.select.filesystem
            ];

            clear();
 
            spinner.start();
            $scope.status = "Loading ...";
            $scope.jobCount = 0;

            reporting.xfsQuery("usage", query, processUsageRange);
        };
 
       
        /**
         * When user change organisation on the page, this fucnction will be called 
         * to filter data.
         *  
         * @export
         */             
        $scope.orgChanged = function() {
            
            $scope.output.summed = [];
            $scope.peak = 0;
            $scope.usageSum = 0;
            
            updateSummary();
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
    }]);
});
