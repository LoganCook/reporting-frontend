define(["app", "lodash", "mathjs","../util"], function(app, _, math, util) {
    app.controller("AllocationSummaryController", ["$rootScope", "$scope", "$timeout", "$q", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, $q, reporting, $uibModal, org) {

        $scope.values = _.values;

        $scope.formatSize = util.formatSize;
        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        
        $scope.alerts = []; 
  
        $scope.usages = [];  
        
        $scope.topOrgs = [];   
        $scope.selectedBillingOrg ='0'; 
        $scope.select= {};
        $scope.filesystemChecked = false; 
        
        $scope.rangeStart  =  new Date();
        $scope.rangeEnd =  new Date();
        $scope.rangeEndOpen = false;
        $scope.openRangeEnd = function() {
            $scope.rangeEndOpen = true;
        }; 
        
        var xfxDefaultHost = "";
        var users = {};
        var rdses = {};
        
        var cache = {};  
        cache.virtualVolumeUsage = [];  
        cache.filesystemUsage = [];
        cache.xfsUsage = [];
        
        var hnas = {};
        hnas.owners = {};   
        hnas.snapshots = {};  
        hnas.filesystems = {};    
        hnas.virtualVolumes = {};  
        
        var xfs = {}; 
        xfs.owners = {};   
        xfs.snapshots = {};  
        xfs.filesystems = {};       
    
        var vuDeferred = {};
        var fuDeferred = {};
        var hnasDeferred = {};
           
        var baseFilters = function() {
            return {
                count: 10000,
                page: 1
            };
        }; 
   
        // Refer to service.xfsBase in client.js 
        var serviceXFSTypes = ["snapshot", "host", "filesystem", "owner"]; 
        var serviceHnasTypes = ["filesystem", "owner", "virtual-volume"];
        
        var clear = function() {   
            vuDeferred = {};
            fuDeferred = {};
            hnasDeferred = {};
             
            cache = {}; 
            cache.virtualVolumeUsage = [];  
            cache.filesystemUsage = []; 
            cache.xfsUsage = [];
             
            $scope.usages = []; 
        }; 

        var initHnas = function() {  
            $scope.status = "Loading ...";  
            $rootScope.spinnerActive = true; 
            
            reporting.hnasBase(processInitData);  
        }; 
        

        var initXFS = function() { 
                
            reporting.xfsBase(function(svc, type, data) { 

                if (type == "snapshot") {
                    xfs.snapshots = util.keyArray(data); 
                    
                }else if (type == "host" && data) { 
                    xfs.host = util.keyArray(data);
                    xfxDefaultHost = data[0].id;// default
                    
                }else if (type == "filesystem" && data) {             
                    _.forEach(data, function(_filesystem) {
                        if(_filesystem.name.endsWith('hpchome')){ 
                            $scope.select.filesystem = _filesystem.id;// default :hpc home
                        }
                        
                        var fileName = _filesystem.name;
                        var idx = fileName.lastIndexOf("/");
                        if(idx > -1){
                             fileName = fileName.substring(idx + 1);
                        } 
                        
                        if(fileName in rdses) {  
                            _filesystem.rds = rdses[fileName].allocation_num;  
                        }else{
                            _filesystem.rds = '-';
                        }   
                    }); 
 
                    xfs.filesystems = util.keyArray(data);     
                }else if (type == "owner" && data) {  
                    xfs.owners = util.keyArray(data); 
                }

                checkInitProcess(serviceXFSTypes, type); 
            });
        }; 

        var processInitData = function(svc, type, data) {  
            if (type == "filesystem") {  

                if (data && data.length > 0) {  
                    $scope.status = "Loaded " + data.length + " filesystems.";  
 
                    _.forEach(data, function(_filesystem) {  
                        if(_filesystem.name  in rdses) {  
                            _filesystem.rds = rdses[_filesystem.name].allocation_num;  
                        }else{
                            _filesystem.rds = '-';
                        }    
                    });      
 
                    hnas.filesystems = util.keyArray(data);  
 
                    //var query = { count: 10000, page:1 ,filter: ["allocation.in." + allocationId]}; 
                    reporting.hnasQuery("virtual-volume", baseFilters(), processVirtualVolume); 

                } else { 
                    $scope.status = "Allocation: 0" ; 
                }  
            }else if (type == "owner") {  
                hnas.owners  = util.keyArray(data);    
            }  

            checkInitProcess(serviceHnasTypes, type); 
        };  

        var processVirtualVolume = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                Array.prototype.push.apply(hnas.virtualVolumes,  data);  
                $scope.status = "Loaded " + data.length + " virtual volumes.";  
                  
                var next = util.nextPage(query);
 
                reporting.hnasQuery("virtual-volume", next, processVirtualVolume);
            } else {   
     
                checkInitProcess(serviceHnasTypes, "virtual-volume");
                
                _.forEach(hnas.virtualVolumes, function(_virtualVolume) {  
                    if (_virtualVolume.filesystem in hnas.filesystems) { 
                        _virtualVolume.filesystem_name = hnas.filesystems[_virtualVolume.filesystem].name;  
                    } 
                     
                    if(_virtualVolume.name in rdses) {
                        _virtualVolume.rds = rdses[_virtualVolume.name].allocation_num;  
                     }else{
                        _virtualVolume.rds = '-';
                    }
                });
            }
        };

        clear();

        // fetching initial data 
        org.getRdses().then(function(data) {
            //If Fileystem usage support owner field, 
            //$scope.topOrgs should be replace to org.getusers();
            $scope.topOrgs = [];
            
            var _rdses = [];
            _.forEach(data, function(rds) {
                _rdses.push(rds.fields);
                var _rds = {"id" : rds.fields.allocation_num.substring(0, 4) , "name" : rds.fields.allocation_num.substring(0, 4)};
                if (_.findWhere($scope.topOrgs, _rds) == null) {
                    $scope.topOrgs.push(_rds);
                }
            }); 
             
            rdses = util.keyArray(_rdses, 'filesystem');
            
            initHnas();
            initXFS();
        });         
        
        // Currently not support 
        var getOrganisationUsers = function() {  
            var userAccountMap = {}; 
            _.forEach($scope.topOrgs, function(org) {
                if($scope.selectedBillingOrg == '0') {
                    _.extend(userAccountMap, users[org.pk]); 
                }else{
                    if($scope.selectedBillingOrg == org.billing) {
                        _.extend(userAccountMap, users[org.pk]); 
                    }
                } 
            });
            return userAccountMap;
        };     
             
        $scope.orgChanged = function() {  
            console.log("orgChanged...");
            updateAllUsages({'orgChanged' : $scope.selectedBillingOrg});   
        }; 
        
        var checkInitProcess = function(serviceTypesArray, type) { 
            
            // Find and remove item from serviceTypes array 
            if(serviceTypesArray.indexOf(type) != -1) {
                serviceTypesArray.splice(serviceTypesArray.indexOf(type), 1);
                $scope.status = "Downloading "  + serviceXFSTypes + serviceHnasTypes; 
            }
            if(!serviceXFSTypes.length && !serviceHnasTypes.length){
                $rootScope.spinnerActive = false; 
                $scope.status = "Initial data loaded.";
            }   
        };     
        
        
        /**
         * This function is called from _export() in ersa-search directive
         */
        $scope.export = function() {
            var records = [];

            _.forEach($scope.usages, function(_usage) {
                records.push([
                    _usage.rds,
                    _usage.filesystem, 
                    $scope.formatSize(_usage.quota),
                    $scope.formatSize(_usage.usage)  
                ]);
            }); 
            
            records = $filter('orderBy')(records, [0, 1]);
               
            var data = [
                ["Allocation", "File system", "Quota", "Usage(avg)"]
            ];
            Array.prototype.push.apply(data, records) ;
            
            data.push([
                'Grand Total', 
                ' - ',  
                $scope.formatSize($scope.usageSum),
                $scope.formatSize($scope.peak)
            ]); 
            
            return data;
        };
    
        $scope.load = function() {
            
            clear();
            
            $scope.rangeStart = util.firstDayOfYearAndMonth($scope.rangeEnd);
            $scope.rangeEnd = util.lastDayOfYearAndMonth($scope.rangeEnd); 
              
            var rangeStartEpoch = util.dayStart($scope.rangeStart);
            var rangeEndEpoch = util.dayEnd($scope.rangeEnd);
            
            var filter =  {
                    filter: [
                        "ts.ge." + rangeStartEpoch,
                        "ts.lt." + rangeEndEpoch
                    ]
                };
            
            var query =  _.merge({count: 100000}, filter);
            $scope.status = "Loading snapshots ...";
             
            vuDeferred = $q.defer();
            fuDeferred = $q.defer();  
            xfsDeferred = $q.defer();  
            
            $q.all([vuDeferred.promise, fuDeferred.promise, xfsDeferred.promise]).then(updateAllUsages);
            
            reporting.hnasQuery("snapshot", query, processHnasSnapshot);
        };
        
        var processHnasSnapshot = function(svc, type, query, data) { 
            
            $rootScope.spinnerActive = true; 
            
            hnas.snapshots = util.keyArray(data); 
            
            if (data && data.length > 0) { 
                
                $scope.status = "Loading filesystem usage ...";   
                var _param = data.map(function(s) { return s.id; }).join(",") ; 
                
                loadVirtualVolumeUsage(_param); 
                loadFilesystemUsage(_param);
                loadXfsUsage();
            } else {  
                $scope.status = "Loaded " + "0 hnas snapshots."; 
            } 
        };

        var updateAllUsages = function(_data) {
            
            console.log("updateAllUsages=" + JSON.stringify(_data) );
            console.log("$scope.selectedBillingOrg=" + $scope.selectedBillingOrg ); 
            console.log("$scope.filesystemChecked=" + $scope.filesystemChecked );
            
            $scope.usages = {};
            [cache.virtualVolumeUsage, cache.filesystemUsage, cache.xfsUsage].forEach(function(usages) {    
                 
                _.forEach(usages, function(_usage) {
                    var _key =  $scope.filesystemChecked ? _usage.filesystem : _usage.rds;
                    if (!(_key in $scope.usages)) {
                        
                        $scope.usages[_key] = {      
                            rds: _usage.rds,                 
                            filesystem: $scope.filesystemChecked ? _usage.filesystem : '-', 
                            quota : 0,
                            usage : 0
                        }; 
                    }

                    if($scope.selectedBillingOrg != '0'){
                        if(!$scope.usages[_key].rds.startsWith($scope.selectedBillingOrg)) {
                            delete $scope.usages[_key];
                            return;
                        }
                    }
                                    
                    if(_usage.quota){
                        $scope.usages[_key].quota += _usage.quota; 
                    }
                    if(_usage.usage){
                        $scope.usages[_key].usage += _usage.usage; 
                    }
                });   
            });   
            
            $scope.usages = _.values($scope.usages); 
            
            $rootScope.spinnerActive = false;  
        };

        /**
         * 01.Virtural Volume Usage
         */
        var loadVirtualVolumeUsage = function(_snapshotParams) {  
            
            var filter =  {filter: ["snapshot.in." + _snapshotParams]};  
            var query = _.merge(baseFilters(), filter);


            $scope.status = "Loading ...";  
            reporting.hnasQuery("virtual-volume/usage", query, processVirtualVolumeUsage);     
        };
   
        var processVirtualVolumeUsage = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                Array.prototype.push.apply(cache.virtualVolumeUsage, data);  
                $scope.status = "Loaded " + cache.virtualVolumeUsage.length + " usages."; 
                 
                var next = util.nextPage(query);
 
                reporting.hnasQuery("virtual-volume/usage", next, processVirtualVolumeUsage);
            } else {    
                cache.virtualVolumeUsage = mapVirtualVolumeUsage(cache.virtualVolumeUsage);
                cache.virtualVolumeUsage = _.values(cache.virtualVolumeUsage);  
                
                vuDeferred.resolve({'VirtualVolumeUsage': 'done'});
            } 
        };
                 
        
        var mapVirtualVolumeUsage = function(data) {  
            
            var virtualVolumeMap = util.keyArray(hnas.virtualVolumes);  
 
            var usageSummary = {}; 
            _.forEach(data, function(_usage) {
                //if($scope.selectedDomain != '' && $scope.selectedDomain != _instanceState.status){
                //   return ; 
                //}    

                if (!(_usage.virtual_volume in usageSummary)) {
                    
                    usageSummary[_usage.virtual_volume] = {     
                        source: 'V',
                        rds: virtualVolumeMap[_usage.virtual_volume].rds,
                        virtual_volumeId: _usage.virtual_volume,                          
                        filesystem: virtualVolumeMap[_usage.virtual_volume].name,
                        filesystem_name: virtualVolumeMap[_usage.virtual_volume].filesystem_name,
                        files : 0,
                        quota : 0,
                        usage : 0,
                        owner : '',
                        usageCount: 0
                    };
                    
                    if(_usage.snapshot in hnas.snapshots){
                        usageSummary[_usage.virtual_volume].snapshotmin= hnas.snapshots[_usage.snapshot].ts;
                        usageSummary[_usage.virtual_volume].snapshotmax= hnas.snapshots[_usage.snapshot].ts;
                    }
                }
                                
                if(_usage.snapshot in hnas.snapshots){
                    var _min = usageSummary[_usage.virtual_volume].snapshotmin;
                    var _max = usageSummary[_usage.virtual_volume].snapshotmax;
                    usageSummary[_usage.virtual_volume].snapshotmin = Math.min(_min, hnas.snapshots[_usage.snapshot].ts);
                    usageSummary[_usage.virtual_volume].snapshotmax = Math.max(_max, hnas.snapshots[_usage.snapshot].ts);
                }
                                
                if(_usage.virtual_volume in virtualVolumeMap){
                    usageSummary[_usage.virtual_volume].usageCount++;
                    usageSummary[_usage.virtual_volume].files += _usage.files;
                    if(_usage.quota){                    
                        usageSummary[_usage.virtual_volume].quota = _usage.quota  * 1024 * 1024; 
                    }
                    usageSummary[_usage.virtual_volume].usage += _usage.usage;
                }
                  
                if(_usage.owner in hnas.owners){
                    usageSummary[_usage.virtual_volume].owner = hnas.owners[_usage.owner].name;
                }
            });
            return usageSummary;
        }
         

        /**
         * 02.File system Usage
         */
        var loadFilesystemUsage = function(_snapshotParams) {
            var filter =  {filter: ["snapshot.in." + _snapshotParams]};
            var query = _.merge(baseFilters(), filter); 

            $scope.status = "Loading ...";
            reporting.hnasQuery("filesystem/usage", query, processFilesystemUsage);
        };
   
        var processFilesystemUsage = function(svc, type, query, data) {
            
            if (data && data.length > 0) {
                Array.prototype.push.apply(cache.filesystemUsage, data);
                $scope.status = "Loaded " + cache.filesystemUsage.length + " usages";
                 
                var next = util.nextPage(query);
 
                reporting.hnasQuery("filesystem/usage", next, processFilesystemUsage);
            } else {
                cache.filesystemUsage = mapFilesystemUsage(cache.filesystemUsage);
                cache.filesystemUsage = _.values(cache.filesystemUsage);
                
                fuDeferred.resolve({'FilesystemUsag': 'done'});
            }
        };
                 
        
        var mapFilesystemUsage = function(data) {
            
            var filesystemMap = util.keyArray(hnas.filesystems);
            var usageSummary = {};
            _.forEach(data, function(_usage) {
                //if($scope.selectedDomain != '' && $scope.selectedDomain != _instanceState.status){
                //    return ; 
                //}   

                if (!(_usage.filesystem in usageSummary)) {

                    usageSummary[_usage.filesystem] = { 
                        source: 'F',
                        rds: filesystemMap[_usage.filesystem].rds,
                        filesystemId: _usage.filesystem,
                        filesystem: filesystemMap[_usage.filesystem].name,
                        quota : 0, //    capacity : 0,
                        free : 0,
                        usage : 0, //live_usage : 0,
                        snapshot_usage : 0,
                        usageCount: 0
                    };     
                    
                    if(_usage.snapshot in hnas.snapshots){ 
                        usageSummary[_usage.filesystem].snapshotmin= hnas.snapshots[_usage.snapshot].ts;
                        usageSummary[_usage.filesystem].snapshotmax= hnas.snapshots[_usage.snapshot].ts;
                    } 
                }   
                  
                if(_usage.snapshot in hnas.snapshots){
                    var _min = usageSummary[_usage.filesystem].snapshotmin;
                    var _max = usageSummary[_usage.filesystem].snapshotmax; 
                    usageSummary[_usage.filesystem].snapshotmin = Math.min(_min, hnas.snapshots[_usage.snapshot].ts);
                    usageSummary[_usage.filesystem].snapshotmax = Math.max(_max, hnas.snapshots[_usage.snapshot].ts);
                }  
                                
                if(_usage.filesystem in filesystemMap){   
                    usageSummary[_usage.filesystem].usageCount++;
                    if(_usage.capacity){
                        usageSummary[_usage.filesystem].quota = _usage.capacity * 1024 * 1024; 
                    }
                    usageSummary[_usage.filesystem].free += _usage.free;
                    usageSummary[_usage.filesystem].usage += _usage.live_usage;
                    usageSummary[_usage.filesystem].snapshot_usage = _usage.snapshot_usage;
                }                      
            });
            return usageSummary;
        } 
          

        /**
         * 03.XFS
         */
        var getXfsHostSnapshots = function(xfxDefaultHost) {  
            var xfsSnapshots = {};
            if (xfxDefaultHost) {
                for (var key in xfs.snapshots) {
                    if (xfs.snapshots[key].host == xfxDefaultHost) { 
                        xfsSnapshots[key] = xfs.snapshots[key];
                    }
                }
            } 
            return xfsSnapshots;        
        }
        
        var getXfsHostFilesystems = function(xfxDefaultHost) {  
            var xfsFilesystems = {};
            if (xfxDefaultHost) {
                for (var key in xfs.filesystems) {
                    if (xfs.filesystems[key].host == xfxDefaultHost) { 
                        xfsFilesystems[key] = xfs.filesystems[key];
                    }
                }
            } 
            return xfsFilesystems;        
        }
        
        var loadXfsUsage = function() {  
            
            var xfsSnapshots = getXfsHostSnapshots(xfxDefaultHost); 
            
            var t1 = util.dayStart($scope.rangeStart);
            var t2 = util.dayEnd($scope.rangeEnd); 
            
            console.log(t1 + ' --- ' + t2); 
            
            var snapshots = _.filter(_.values(xfsSnapshots), function(snapshot) {
                return (snapshot.ts >= t1) && (snapshot.ts < t2);
            });

            // Take a sample of snapshots to keep things manageable. Sort by UUID (which
            // is consistent and pseudorandom) and grab the first N (snapshotLimit).

            var days = (t2 - t1) / (24 * 60 * 60);
            var snapshotLimit = Math.max(250, days);

            snapshots.sort(function(s1, s2) {
                if (s1.id > s2.id) {
                    return 1;
                } else if (s1.id < s2.id) {
                    return -1;
                } else {
                    return 0;
                }
            });
            
            //snapshots = snapshots.slice(0, snapshotLimit) -- comment out by Rex;

            var timestamps = snapshots.map(function(s) { return s.ts; });

            var earlierSnapshots = _.values(xfsSnapshots).filter(function(s) {
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

            var query = { count: 80000,  page: 1};

            query.filter = [
                "snapshot.in." + snapshots.map(function(s) { return s.id; }).join(","),
                "filesystem.ne." + $scope.select.filesystem
            ]; 
 
            $scope.status = "Loading ...";
            $scope.jobCount = 0;

            reporting.xfsQuery("usage", query, processXfsUsageRange);
            
        };
         
         

        var processXfsUsageRange = function(svc, type, query, data) {
            
            if (data && data.length > 0) {
                Array.prototype.push.apply(cache.xfsUsage, data);

                $scope.status = "Loaded " + cache.xfsUsage.length + " usage records.";

                var next = util.nextPage(query);

                reporting.xfsQuery("usage", next, processXfsUsageRange);
            } else {
                 
                $scope.status = "Usage records: " + cache.xfsUsage.length + ". Snapshots: " + $scope.select.snapshots.length + ".";
                
                cache.xfsUsage = mapXfsUsage(cache.xfsUsage);
                xfsDeferred.resolve({'XfsUsage': 'done'});
            } 
        };         
         
         

        var mapXfsUsage  = function(data) {

            if (data.length === 0) {
                console.log('data.length --' + data.length );
                return;
            }

            var xfsSnapshots = getXfsHostSnapshots(xfxDefaultHost); 
            var xfsFilesystems = getXfsHostFilesystems(xfxDefaultHost);
            
            var t1 = util.dayStart($scope.rangeStart);
            var t2 = util.dayEnd($scope.rangeEnd);

            var weights = util.durationWeight(t1, t2, $scope.select.timestamps); 
 
            var summed = {};
            
            _.forEach(data, function(record) {
                var _sumeKey = record.filesystem; 
                if (!(_sumeKey in summed)) {
                    summed[_sumeKey] = {
                        rds: xfsFilesystems[_sumeKey].rds, 
                        filesystem: xfsFilesystems[_sumeKey].name, 
                        school: "",
                        organisation: "",
                        quota: 0,
                        usage: 0,
                        peak: 0
                    };  
                }                
                
                //if($scope.selectedBillingOrg != '0' && !summed[_sumeKey].school ) {
                //    delete summed[_sumeKey];
                //    return;
                //}
                
                var recordUsage = record.usage * 1024;

                var userSum = summed[_sumeKey];

                var snapshot = xfsSnapshots[record.snapshot];

                var weightedUsage = weights[snapshot.ts] * recordUsage;

                userSum.quota += record.hard;
                userSum.usage += weightedUsage;

                if (recordUsage > userSum.peak) {
                    userSum.peak = recordUsage;
                }
                 
                $scope.usageSum += weightedUsage;
                if (userSum.peak > $scope.peak) {
                    $scope.peak = userSum.peak;
                }
            });  
            
            // clear memory 
            var summedByRds = {};
            $scope.usageSum = 0;
            $scope.peak = 0;
            
            _.forEach(summed, function(entry) {

                if (!(entry.filesystem in summedByRds)) {
                    summedByRds[entry.filesystem] = {
                        source: 'X',
                        rds: entry.rds,   
                        filesystem: entry.filesystem,
                        username: '',// dummy for orderby in page 
                        quota: 0,
                        usage: 0,
                        peak: 0
                    };
                }

                summedByRds[entry.filesystem].quota = entry.quota;
                summedByRds[entry.filesystem].usage += entry.usage;
                if (entry.peak > summedByRds[entry.filesystem].peak) {
                    summedByRds[entry.filesystem].peak = entry.peak;
                }
                
                $scope.usageSum += entry.usage;
                if (entry.peak > $scope.peak) {
                    $scope.peak = entry.peak;
                }
            }); 
             
            return _.values(summedByRds); 
        };         
         
          
         
        
        $scope.$on('$viewContentLoaded', function() { 

            $scope.startDateTitle = "Snapshot Start Date";
            $scope.endDateTitle = "Snapshot End Date";
                            
            var startDate = new Date();
            var endDate = new Date();
            startDate.setDate(startDate.getDate() -1);
           // $scope.rangeStart = startDate;
            //endDate.setDate(endDate.getDate() -82);
            //$scope.rangeEnd = endDate;
            console.log('viewContentLoaded ...'); 
        }); 
                            
    }]);   
});

