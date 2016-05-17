define(["app", "lodash", "mathjs","../util"], function(app, _, math, util) {
    app.controller("HNASController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
 
        $scope.values = _.values;

        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.alerts = []; 
  
 
        var snapshots= {};    
        var allocations= {};    
        var owners = {};  
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
              
        }; 

 
        var initHnas = function() {  
            reporting.hnasBase(processInitData);  
        };

        var processInitData = function(svc, type, data) {  
            if (type == "allocation") {  

                if (data && data.length > 0) {  
                    allocations  = util.keyArray(data); 
                     
                    //var query = { count: 10000, page:1, filter: ["allocation.in." + allocationId]}; 
                    reporting.hnasQuery("filesystem", baseFilters, processFilesystem);
                } else { 
                    $scope.status = "Allocation: " + $scope.jobCount; 
                }  
            }else if (type == "owner") {  
                owners  = util.keyArray(data);    
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
                    if (_filesystem.allocation in allocations) { 
                        _filesystem.allocation_name = allocations[_filesystem.allocation].allocation;  
                    }     
                });

                if (data && data.length > 0) {   
                    //var query = { count: 10000, page:1, filter: ["allocation.in." + allocationId]}; 
                    reporting.hnasQuery("virtual-volume", baseFilters, processVirtualVolume); 
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
                
                _.forEach(virtualVolumes, function(_virtualVolume) { 
                    if (_virtualVolume.allocation in allocations) { 
                        _virtualVolume.allocation_name = allocations[_virtualVolume.allocation].allocation;  
                    }     
                });                 
                
            } 
        };
        

        clear();
        initHnas();    
        
        
        
                
                            
    }]);   
});

