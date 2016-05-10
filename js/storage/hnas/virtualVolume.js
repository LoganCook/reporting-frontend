define(["app", "lodash", "mathjs","../../util"], function(app, _, math, util) {
    app.controller("VirtualVolumeController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
 
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
        
        var snapshots= {};    
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
            snapshots= {};      
            
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
            }else if (type == "owner") {  
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
                        _virtualVolume.filesystem_name = filesystemMap[_virtualVolume.filesystem].name;  
                    }                        
                });       
            } 
        }; 

        clear();
        initHnas();     

        /**
         * This function is called from _export() in ersa-search directive
         */
        $scope.export = function() {
            var dataWithTitle = [
                ["Volume", "File system", "Quota", "Files(avg)", "Usage(avg)"]
            ];
            var data = [];

            _.forEach(usageSummary, function(usage) {
                data.push([
                    usage.virtual_volume_name,
                    usage.filesystem_name,
                    $scope.formatNumber(usage.quota),
                    $scope.formatNumber(usage.files / usage.usageCount),
                    $scope.formatNumber(usage.usage / usage.usageCount) 
                ]);
            });
            
            data.sort(function(a, b) {
                if(a[0].toLowerCase() >= b[0].toLowerCase()){return 1;}
                return -1; 
            });
                        
            Array.prototype.push.apply(dataWithTitle, data); 
            return dataWithTitle;
        };        
    
        $scope.load = function() { 
            
            clear();  
            
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
                for(var i = 1; i <= allsnapshot; i++){
                    _param += data[i - 1].id ;
                    if( i != allsnapshot){  
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
                //if($scope.selectedDomain != '' && $scope.selectedDomain != _instanceState.status){
                //   return ; 
                //}    

                if (!(_usage.virtual_volume in usageSummary)) {
                    
                    usageSummary[_usage.virtual_volume] = { 
                        virtual_volume: _usage.virtual_volume,                       
                        virtual_volume_name: virtualVolumeMap[_usage.virtual_volume].name, 
                        filesystem_name: virtualVolumeMap[_usage.virtual_volume].filesystem_name, 
                        files : 0,
                        quota : 0,
                        usage : 0,
                        owner : '',
                        usageCount: 0
                    };     
                    
                    if(_usage.snapshot in snapshots){ 
                        usageSummary[_usage.virtual_volume].snapshotmin= snapshots[_usage.snapshot].ts;
                        usageSummary[_usage.virtual_volume].snapshotmax= snapshots[_usage.snapshot].ts;
                    } 
                }     
                                
                if(_usage.snapshot in snapshots){
                    var _min = usageSummary[_usage.virtual_volume].snapshotmin;
                    var _max = usageSummary[_usage.virtual_volume].snapshotmax; 
                    usageSummary[_usage.virtual_volume].snapshotmin = Math.min(_min, snapshots[_usage.snapshot].ts);
                    usageSummary[_usage.virtual_volume].snapshotmax = Math.max(_max, snapshots[_usage.snapshot].ts);
                }  
                                
                if(_usage.virtual_volume in virtualVolumeMap){   
                    usageSummary[_usage.virtual_volume].usageCount++;
                    usageSummary[_usage.virtual_volume].files += _usage.files;
                    usageSummary[_usage.virtual_volume].quota = _usage.quota;
                    usageSummary[_usage.virtual_volume].usage += _usage.usage;  
                }         
                  
                if(_usage.owner in $scope.owners){     
                    usageSummary[_usage.virtual_volume].owner = $scope.owners[_usage.owner].name; 
                }  
                
                //swap.push(_.values(instanceSummary));                
            });
            return swap;
        } 
         
        
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

