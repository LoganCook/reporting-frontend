define(["app", "lodash", "mathjs","../../util"], function(app, _, math, util) {
    app.controller("VirtualVolumeController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
 
        $scope.values = _.values;

        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.alerts = []; 
  
        $scope.cache = {};  
        $scope.cache.virtualVolumeUsage = []; 
 
        $scope.virtualVolumeUsage = [];
        $scope.allocations = {};    
        $scope.owners = {};   
        
        var snapshots= {};    
        var filesystems = {};  
        var virtualVolumes = {};  
        var baseFilters = function() {
            return {
                count: 1000,
                page: 1
            };
        }; 
   
        var clear = function() {    
            snapshots= {};      
            
            $scope.cache = {}; 
            $scope.cache.filesystemUsage = []; 
        }; 

 
        var initHnas = function() {  
            $scope.status = "Loading ...";  
            reporting.hnasBase(processInitData);  
        };

        var processInitData = function(svc, type, data) {  
            if (type == "allocation") {  

                if (data && data.length > 0) {  
                    $scope.allocations  = util.keyArray(data); 
                    $scope.status = "Allocation: " + data.length; 
                     
                    //var query = { count: 10000, page:1, filter: ["allocation.in." + allocationId]}; 
                    //reporting.hnasQuery("filesystem", baseFilters(), processFilesystem);
                } else { 
                    $scope.status = "Allocation: 0" ; 
                }  
            }else if (type == "owner") {  
                $scope.owners  = util.keyArray(data);    
            }  
        }; 
        

        var processFilesystem = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                Array.prototype.push.apply(filesystems,  data);  
                $scope.status = "Loaded " + data.length + " filesystems.";  
                
                $rootScope.spinnerActive = true;
                  
                var next = util.nextPage(query);
 
                reporting.hnasQuery("filesystem", next, processFilesystem);
            } else { 
                $rootScope.spinnerActive = false;
                
                _.forEach(filesystems, function(_filesystem) { 
                    if (_filesystem.allocation in $scope.allocations) { 
                        _filesystem.allocation_name = $scope.allocations[_filesystem.allocation].allocation;  
                    }     
                });

                if (data && data.length > 0) {   
                    //var query = { count: 10000, page:1, filter: ["allocation.in." + allocationId]}; 
                    reporting.hnasQuery("virtual-volume", baseFilters(), processVirtualVolume); 
                }               
                                   
            } 
        };        


        var processVirtualVolume = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                Array.prototype.push.apply(virtualVolumes,  data);  
                $scope.status = "Loaded " + data.length + " virtual-volume.";  
                
                $rootScope.spinnerActive = true;
                  
                var next = util.nextPage(query);
 
                reporting.hnasQuery("virtual-volume", next, processVirtualVolume);
            } else { 
                $rootScope.spinnerActive = false;
                var filesystemMap = util.keyArray(filesystems);  
                
                _.forEach(virtualVolumes, function(_virtualVolume) { 
                    if (_virtualVolume.allocation in $scope.allocations) { 
                        _virtualVolume.allocation_name = allocations[_virtualVolume.allocation].allocation;  
                    }  
                    
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
            reporting.hnasQuery("virtual-volume/usage", query, processVirtualVolumeUsage);     
        };
   
        var processVirtualVolumeUsage = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                Array.prototype.push.apply($scope.cache.virtualVolumeUsage, data);  
                $scope.status = "Loaded " + $scope.cache.virtualVolumeUsage.length + " instances states."; 
                
                $rootScope.spinnerActive = true; 
                var next = util.nextPage(query);
 
                reporting.novaQuery("virtual-volume/usage", next, processVirtualVolumeUsage);
            } else {  
                $rootScope.spinnerActive = false;
                
                mapVirtualVolumeUsage($scope.cache.virtualVolumeUsage);
                $scope.virtualVolumeUsage = $scope.cache.virtualVolumeUsage; 
                
            } 
        };
                 
        
        var mapVirtualVolumeUsage = function(data) {  
            
            var swap = []; 
            _.forEach(data, function(_instanceState) {
                if($scope.selectedDomain != '' && $scope.selectedDomain != _instanceState.status){
                    return ; 
                }   

                if (!(_instanceState.instance in instanceSummary)) {

                    instanceSummary[_instanceState.instance] = { 
                        openstack_id: $scope.instances[_instanceState.instance].openstack_id,                       
                        name: _instanceState.name 
                    };     
                    
                    if(_instanceState.snapshot in snapshots){ 
                        instanceSummary[_instanceState.instance].snapshotmin= snapshots[_instanceState.snapshot].ts;
                        instanceSummary[_instanceState.instance].snapshotmax= snapshots[_instanceState.snapshot].ts;
                    } 
                }     
                                
                if(_instanceState.instance in $scope.instances){   
                     
                    instanceSummary[_instanceState.instance].tenant_name = $scope.instances[_instanceState.instance].tenant_name;
                    
                    if(_instanceState.snapshot in snapshots){
                        var _min = instanceSummary[_instanceState.instance].snapshotmin;
                        var _max = instanceSummary[_instanceState.instance].snapshotmax; 
                        instanceSummary[_instanceState.instance].snapshotmin = Math.min(_min, snapshots[_instanceState.snapshot].ts);
                        instanceSummary[_instanceState.instance].snapshotmax = Math.max(_max, snapshots[_instanceState.snapshot].ts);
                    } 
                    
                    if(_instanceState.hypervisor in hypervisors){ 
                        instanceSummary[_instanceState.instance].hypervisorname = hypervisors[_instanceState.hypervisor].name;  
                    }else{
                        instanceSummary[_instanceState.instance].hypervisorname = "-"; 
                    } 
                    
                    if ($scope.instances[_instanceState.instance].flavor in flavors) {
                        var flavorId = $scope.instances[_instanceState.instance].flavor; 
                        instanceSummary[_instanceState.instance].flavorname= flavors[flavorId].name;
                        instanceSummary[_instanceState.instance].vcpus = flavors[flavorId].vcpus;
                        instanceSummary[_instanceState.instance].ram = flavors[flavorId].ram;
                        instanceSummary[_instanceState.instance].disk = flavors[flavorId].disk;
                        instanceSummary[_instanceState.instance].ephemeral = flavors[flavorId].ephemeral; 
                    }else{
                        instanceSummary[_instanceState.instance].flavorname= "-";
                        instanceSummary[_instanceState.instance].vcpus = "-";
                        instanceSummary[_instanceState.instance].ram = "-";
                        instanceSummary[_instanceState.instance].disk = "-";
                        instanceSummary[_instanceState.instance].ephemeral = "-"; 
                    }                           
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

