define(["app", "lodash", "mathjs","../../util"], function(app, _, math, util) {
    app.controller("VirtualVolumeController", ["$rootScope", "$scope", "$timeout", "reporting",
    function($rootScope, $scope, $timeout, reporting) {
 
        $scope.values = _.values;

        $scope.formatSize = util.formatSize;
        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.alerts = []; 
  
        $scope.cache = {};  
        $scope.cache.virtualVolumeUsage = [];  
        $scope.virtualVolumeUsage = []; 
        
        $scope.owners = {};   
        
        var snapshots = {};    
        var filesystems = {};  
        var virtualVolumes = {};  
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
            $scope.cache.virtualVolumeUsage = [];  
            usageSummary = {};  
        }; 

 
        var initHnas = function() {  
            $scope.status = "Loading ...";  
            $rootScope.spinnerActive = true; 
            
            reporting.hnasBase(processInitData);  
        };

        var processInitData = function(svc, type, data) {  
            if (type == "filesystem") {  

                if (data && data.length > 0) {  
                    Array.prototype.push.apply(filesystems,  data);  
                    $scope.status = "Loaded " + data.length + " filesystems."; 
 
                    //var query = { count: 10000, page:1 ,filter: ["allocation.in." + allocationId]}; 
                    reporting.hnasQuery("virtual-volume", baseFilters(), processVirtualVolume); 

                } else { 
                    $scope.status = "Allocation: 0" ; 
                }  
            } else if (type == "owner") {  
                $scope.owners  = util.keyArray(data);    
            }  
        };  

        var processVirtualVolume = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                Array.prototype.push.apply(virtualVolumes,  data);  
                $scope.status = "Loaded " + data.length + " virtual volumes.";  
                
                $rootScope.spinnerActive = true;
                  
                var next = util.nextPage(query);
 
                reporting.hnasQuery("virtual-volume", next, processVirtualVolume);
            } else { 
                $rootScope.spinnerActive = false;
                var filesystemMap = util.keyArray(filesystems);  
                
                _.forEach(virtualVolumes, function(_virtualVolume) {  
                    if (_virtualVolume.filesystem in filesystemMap) { 
                        _virtualVolume.filesystemName = filesystemMap[_virtualVolume.filesystem].name;  
                    }                        
                });       
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
                
                loadVirtualVolumeUsage(_param); 
                
            } else {  
                $scope.status = "Loaded " + "0 snapshots."; 
            } 
        };     


        var loadVirtualVolumeUsage = function(_snapshotParams) { 
 
            var filter =  {filter: ["snapshot.in." + _snapshotParams]};  
            var query = _.merge(baseFilters(), filter);

            $rootScope.spinnerActive = true; 

            $scope.status = "Loading ...";  
            reporting.hnasQuery("virtual-volume/usage", query, processVirtualVolumeUsage);     
        };
   
        var processVirtualVolumeUsage = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                Array.prototype.push.apply($scope.cache.virtualVolumeUsage, data);  
                $scope.status = "Loaded " + $scope.cache.virtualVolumeUsage.length + " usages."; 
                
                $rootScope.spinnerActive = true; 
                var next = util.nextPage(query);
 
                reporting.hnasQuery("virtual-volume/usage", next, processVirtualVolumeUsage);
            } else {  
                $rootScope.spinnerActive = false;
                
                mapVirtualVolumeUsage($scope.cache.virtualVolumeUsage);
                $scope.virtualVolumeUsage = _.values(usageSummary); 
                
            } 
        };
                 
        
        var mapVirtualVolumeUsage = function(data) {  
            
            var virtualVolumeMap = util.keyArray(virtualVolumes);  
            var swap = []; 
            _.forEach(data, function(_usage) {
    
                var _virtualVolume = _usage.virtual_volume;
                
                if (!(_virtualVolume in usageSummary)) {
                    
                    usageSummary[_virtualVolume] = { 
                        virtualVolume: _virtualVolume,                       
                        virtualVolumeName: virtualVolumeMap[_virtualVolume].name, 
                        filesystemName: virtualVolumeMap[_virtualVolume].filesystemName, 
                        files : 0,
                        quota : 0,
                        usage : 0,
                        owner : '',
                        usageCount: 0
                    };     
                    
                    if (_usage.snapshot in snapshots) { 
                        usageSummary[_virtualVolume].snapshotmin = snapshots[_usage.snapshot].ts;
                        usageSummary[_virtualVolume].snapshotmax = snapshots[_usage.snapshot].ts;
                    } 
                }     
                                
                if (_usage.snapshot in snapshots) {
                    var _min = usageSummary[_virtualVolume].snapshotmin;
                    var _max = usageSummary[_virtualVolume].snapshotmax; 
                    usageSummary[_virtualVolume].snapshotmin = Math.min(_min, snapshots[_usage.snapshot].ts);
                    usageSummary[_virtualVolume].snapshotmax = Math.max(_max, snapshots[_usage.snapshot].ts);
                }  
                                
                if (_virtualVolume in virtualVolumeMap) {   
                    usageSummary[_virtualVolume].usageCount++;
                    usageSummary[_virtualVolume].files += _usage.files;
                    usageSummary[_virtualVolume].quota = _usage.quota;
                    usageSummary[_virtualVolume].usage += _usage.usage;  
                }         
                  
                if (_usage.owner in $scope.owners) {     
                    usageSummary[_virtualVolume].owner = $scope.owners[_usage.owner].name; 
                }  
                
                //swap.push(_.values(instanceSummary));                
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

