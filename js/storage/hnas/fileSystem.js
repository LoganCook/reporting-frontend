define(["app", "lodash", "mathjs","../../util"], function(app, _, math, util) {
    app.controller("FileSystemController", ["$rootScope", "$scope", "$timeout", "reporting",
    function($rootScope, $scope, $timeout, reporting) {
 
        $scope.values = _.values;

        $scope.formatSize = util.formatSize;
        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.alerts = []; 
  
        $scope.cache = {}; 
        $scope.cache.filesystemUsage = [];
        $scope.filesystemUsage = []; 
   
        $scope.owners = {};    
        
        var snapshots = {};    
        var filesystems = {};   
        var usageSummary = {};  
        
        var baseFilters = function() {
            return {
                count: 10000,
                page: 1
            };
        }; 
   
        var clear = function() {    
            snapshots = {};      
            
            $scope.cache = {}; 
            $scope.cache.filesystemUsage = []; 
            usageSummary = {}; 
        }; 

 
        var initHnas = function() {  
            $rootScope.spinnerActive = true; 
            $scope.status = "Loading ...";  
            reporting.hnasBase(processInitData);  
        };

        var processInitData = function(svc, type, data) {  
            if (type == "filesystem") {  

                if (data && data.length > 0) {   
                    Array.prototype.push.apply(filesystems,  data);  
                    $scope.status = "Loaded " + data.length + " filesystems."; 
 
                } else { 
                    $scope.status = "Filesystem: 0" ; 
                }  
                
                $rootScope.spinnerActive = false; 
            } else if (type == "owner") {  
                $scope.owners  = util.keyArray(data);    
            }  
        };   

        clear();
        initHnas();     

        /**
         * This function is called from _load() in ersa-search directive
         * arg : rangeEpochFilter - filter:["end.ge.1459953000", "end.lt.1460039400"]
         */        
        $scope.load = function(rangeEpochFilter) { 
            
            clear();  
            
            if (rangeEpochFilter) { 
                /** rangeEpochFilter not used because this function use ts.ge and ts.lt */
            } 
            
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
            reporting.hnasQuery("snapshot", query, processSnapshot);  
        };
        
        var processSnapshot = function(svc, type, query, data) { 
            
            snapshots = util.keyArray(data); 
            
            if (data && data.length > 0) { 
                
                $scope.status = "Loading filesystem usage ...";  

                var allsnapshot = data.length;    
                var _param = "";
                for (var i = 1; i <= allsnapshot; i++) {
                    _param += data[i - 1].id ;
                    if ( i != allsnapshot) {  
                        _param += ",";
                    } 
                }                
                
                loadFilesystemUsage(_param); 
                
            } else {  
                $scope.status = "Loaded " + "0 snapshots."; 
            } 
        };     


        var loadFilesystemUsage = function(_snapshotParams) {   
            
            var filter =  {filter: ["snapshot.in." + _snapshotParams]};  
            var query = _.merge(baseFilters(), filter);

            $rootScope.spinnerActive = true; 

            $scope.status = "Loading ...";  
            reporting.hnasQuery("filesystem/usage", query, processFilesystemUsage);     
        };
   
        var processFilesystemUsage = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                Array.prototype.push.apply($scope.cache.filesystemUsage, data);  
                $scope.status = "Loaded " + $scope.cache.filesystemUsage.length + " usages"; 
                
                $rootScope.spinnerActive = true; 
                var next = util.nextPage(query);
 
                reporting.hnasQuery("filesystem/usage", next, processFilesystemUsage);
            } else {  
                $rootScope.spinnerActive = false;
                
                mapFilesystemUsage($scope.cache.filesystemUsage); 
                $scope.filesystemUsage = _.values(usageSummary);
            } 
        };
                 
        
        var mapFilesystemUsage = function(data) {  
            
            var filesystemMap = util.keyArray(filesystems);  
            var swap = []; 
            _.forEach(data, function(_usage) { 
                
                var _filesystem = _usage.filesystem;
                if (!(_filesystem in usageSummary)) {

                    usageSummary[_filesystem] = { 
                        filesystemId: _filesystem,                       
                        name: filesystemMap[_filesystem].name, 
                        capacity : 0,
                        free : 0,
                        liveUsage : 0,
                        snapshotUsage : 0,
                        usageCount: 0
                    };     
                    
                    if (_usage.snapshot in snapshots) { 
                        usageSummary[_filesystem].snapshotmin = snapshots[_usage.snapshot].ts;
                        usageSummary[_filesystem].snapshotmax = snapshots[_usage.snapshot].ts;
                    } 
                }   
                  
                if (_usage.snapshot in snapshots) {
                    var _min = usageSummary[_filesystem].snapshotmin;
                    var _max = usageSummary[_filesystem].snapshotmax; 
                    usageSummary[_filesystem].snapshotmin = Math.min(_min, snapshots[_usage.snapshot].ts);
                    usageSummary[_filesystem].snapshotmax = Math.max(_max, snapshots[_usage.snapshot].ts);
                }  

                if (_filesystem in filesystemMap) {   
                    usageSummary[_filesystem].usageCount++;
                    usageSummary[_filesystem].capacity = _usage.capacity;
                    usageSummary[_filesystem].free += _usage.free;
                    usageSummary[_filesystem].liveUsage += _usage.live_usage;
                    usageSummary[_filesystem].snapshotUsage = _usage.snapshot_usage;
                }                       
            });
            return swap;
        };  
        
        $scope.$on('$viewContentLoaded', function() { 

            $scope.startDateTitle = "Snapshot Start Date";
            $scope.endDateTitle = "Snapshot End Date";
                            
            var startDate = new Date(); 
            startDate.setDate(startDate.getDate() - 1);  
        });    
    }]);   
});
