define(["app", "lodash", "mathjs","../util"], function(app, _, math, util) {
    app.controller("NovaController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
  
        //only sa zone 
        var saZonefilter =  {filter: ["availability_zone.in.6e2fcd7c-63a9-4f03-a2f8-cd545366de82"]}; 

        $scope.values = _.values;

        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.alerts = []; 

        $scope.select = {
            snapshot: null
        };
        
        $scope.cache = {}; 
        $scope.cache.instancesState = [];
        
        $scope.instances = {}; 
        $scope.instancesStatus = {}; 
        $scope.azs = {}; 
        $scope.hypervisors = {}; 
        $scope.flavors= {};  
        $scope.ips = {};  
         
        $scope.selectedStatus = ''; 
        $scope.selectedSnapshot = '';
         
        var instances = {};    
        var snapshots= {};    
        var baseFilters = function() {
            return {
                count: 1000,
                page: 1
            };
        }; 
   
        var clear = function() {    
            snapshots= {};    
            $scope.status = "Zero instances loaded.";  
            $scope.selectedStatus = ''
            $scope.instancesState = []; 
             
            $scope.cache = {}; 
            $scope.cache.instancesState = [];
        }; 

        var processInitData = function(svc, type, data) {  
            if (type == "instance/status") {   
                $scope.instancesStatus  = util.keyArray(data);  
            }else if (type == "az") {  
                $scope.azs  = util.keyArray(data);  
            }else if (type == "hypervisor") {  
                $scope.hypervisors  = util.keyArray(data);  
            }else if (type == "flavor") {  
                $scope.flavors  = util.keyArray(data);  
            }else if (type == "ip") {  
                $scope.ips  = util.keyArray(data);  
            }  
        }; 
 
        var processInstance = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                
                Array.prototype.push.apply(instances,  data);  
                
                $scope.instances = util.keyArray(instances); 
                
                var next = util.nextPage(query);
 
                reporting.novaQuery("instance", next, processInstance);
            } else { 
                //$rootScope.spinnerActive = false; 
            } 
        };

 
        var initNova = function() {  
            reporting.novaBase(processInitData); 
             
            var query = _.merge(baseFilters(), saZonefilter);
            reporting.novaQuery("instance", query, processInstance);
        };

        clear();

        initNova();
   
        $scope.statusChanged = function() { 
            $scope.instancesState = mapInstanceState($scope.cache.instancesState);  
        }; 
                
        var mapInstanceState = function(data) { 
             
            /// Assign base data ////
            
            _.forEach($scope.hypervisors, function(_hypervisor) {   
                if (_hypervisor.availability_zone in $scope.azs) { 
                    //_hypervisor["azname"] = $scope.azs[_hypervisor.availability_zone].name;
                }
            });
             
            _.forEach($scope.instances, function(_instances) {   
                if (_instances.flavor in $scope.flavors) { 
                    _instances["flavorname"] = $scope.flavors[_instances.flavor].name;
                    _instances["vcpus"] = $scope.flavors[_instances.flavor].vcpus;
                    _instances["ram"] = $scope.flavors[_instances.flavor].ram;
                    _instances["disk"] = $scope.flavors[_instances.flavor].disk;
                    _instances["ephemeral"] = $scope.flavors[_instances.flavor].ephemeral;
                    _instances["public"] = $scope.flavors[_instances.flavor].public;
                }
            });
            
            ////////////////////////////////////////////////////////
            
            var swap = [];
            _.forEach(data, function(_instanceState) {
                if($scope.selectedStatus != '' && $scope.selectedStatus != _instanceState.status){
                    return ; 
                } 
                 
                if(_instanceState.snapshot in snapshots){ 
                    _instanceState["snapshotts"] = $scope.formatTimestamp(snapshots[_instanceState.snapshot].ts);
                }else{
                    _instanceState["snapshotts"] = "-";
                }
                
                if(_instanceState.status in $scope.instancesStatus){ 
                    _instanceState["statusname"] = $scope.instancesStatus[_instanceState.status].name;
                }else{
                    _instanceState["statusname"] = "-";
                }
                
                if(_instanceState.instance in $scope.instances){ 
                    //_instanceState["instanceid"] = $scope.instances[_instanceState.instance].id;
                    _instanceState["account"] = $scope.instances[_instanceState.instance].account;
                    
                    _instanceState["flavorname"] = $scope.instances[_instanceState.instance].flavorname;
                    _instanceState["vcpus"] = $scope.instances[_instanceState.instance].vcpus;
                    _instanceState["ram"] = $scope.instances[_instanceState.instance].ram;
                    _instanceState["disk"] = $scope.instances[_instanceState.instance].disk;
                    _instanceState["ephemeral"] = $scope.instances[_instanceState.instance].ephemeral;
                    _instanceState["public"] = $scope.instances[_instanceState.instance].public;
                }else{
                    //_instanceState["instanceid"] = "-";
                    _instanceState["flavorname"] = "-";
                    _instanceState["account"] = "-";
                } 
                
                if(_instanceState.hypervisor in $scope.hypervisors){ 
                    _instanceState["hypervisorname"] = $scope.hypervisors[_instanceState.hypervisor].name;
                    //_instanceState["azname"] = $scope.hypervisors[_instanceState.hypervisor].azname;
                }else{
                    _instanceState["hypervisorname"] = "-";
                    _instanceState["azname"] = "-";
                }
                
                
                
                
                swap.push(_instanceState);                
            });
            return swap;
        }
        
        
        var mapIpAddress = function(ipAddressMaps) {  
            
            _.forEach($scope.instancesState, function(_instancesState) {   
                if ((_instancesState.instance + _instancesState.snapshot) in ipAddressMaps) { 
                        _instancesState["ipaddress"] = ipAddressMaps[(_instancesState.instance + _instancesState.snapshot)].ipaddress;  
                }
            }); 
        }
                
        var processInstanceState = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                Array.prototype.push.apply($scope.cache.instancesState, data); 
                
                _mappedData = mapInstanceState(data);
                
                Array.prototype.push.apply($scope.instancesState, _mappedData); 
                $scope.status = "Loaded " + $scope.cache.instancesState.length + " instances states."; 
                
                $rootScope.spinnerActive = false;
                
                //// after fetch instance state
                //reporting.novaQuery("ip/mapping", query, processIpMapping);    
                
                var next = util.nextPage(query);
 
                //reporting.novaQuery("instance/state", next, processInstanceState);
            } else {
                //$scope.status = "Jobs: " + $scope.jobCount;
                $rootScope.spinnerActive = false;
            } 
        };
                
        var processIpMapping = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                _.forEach(data, function(_ipaddress) {   
                    if (_ipaddress.address in $scope.ips) { 
                        _ipaddress["ipaddress"] = $scope.ips[_ipaddress.address].address; 
                    }
                });          
                 
                mapIpAddress(util.multiKeyArray(data, "instance", "snapshot")); 
 
                $rootScope.spinnerActive = false;
                
                var next = util.nextPage(query);
 
                //reporting.novaQuery("ip/mapping", next, processIpMapping);
            } else {
                //$scope.status = "Jobs: " + $scope.jobCount;
                $rootScope.spinnerActive = false;
            } 
        };
        
        
        /**
         * This function is called from _export() in ersa-search directive
         */
        $scope.export = function() { 
            data = [
                ["Name", "Status", "Hyperviso", "Flavorname", "VCPUs", "RAM", "Disk", "Ephemeral", "Public"]
            ];

            _.forEach($scope.instancesState, function(_instancesState) {
                data.push([
                    _instancesState.name,
                    _instancesState.statusname,
                    _instancesState.hypervisorname,
                    _instancesState.flavorname,
                    _instancesState.vcpus ,
                    _instancesState.ram ,
                    _instancesState.disk ,
                    _instancesState.ephemeral ,
                    _instancesState.public 
                ]);
            });
            
            data.sort(function(a, b) {
                if(a[2] >= b[2]){return 1;}
                return -1; 
            });
            
            return data;            
        }    
        

        var loadInstanceState = function(_snapshotParams) {  
            
            var allIntance = instances.length;
            var instanceParams = [];
            var _param = "";
            for(var i = 1; i <= allIntance; i++){
                _param += instances[i - 1].id ;
                if((i % 20) == 0){
                    instanceParams.push(_param);
                    _param = "";
                }else{
                    _param += ",";
                } 
            }
             
            _.forEach(instanceParams, function(_instanceParams) { 
                 
                var filter =  {
                        filter: [
                            "instance.in." + _instanceParams,
                            "snapshot.in." + _snapshotParams,
                        ]
                    }; 
                
                var query = _.merge(baseFilters(), filter);
                //query : {count:25000, page:1, filter:[queue.in.1210458a-4145-4f67-a19d-02be24a29fb6,2841930e-e8aa-4eaf-b938-ade7033e8532,32c6532e-2b34-4d06-9873-38c9cc1cddf9"]}

                $rootScope.spinnerActive = true; 

                $scope.status = "Loading ...";  
                reporting.novaQuery("instance/state", query, processInstanceState);    
            }); 
        };

         
        var loadAccounts = function(_snapshotParams) {   
 
            var allIntance = instances.length;                    
            var accountParams = [];
            var _param = "";
            for(var i = 1; i <= allIntance; i++){
                _param += instances[i - 1].id ;
                if((i % 20) == 0){
                    accountParams.push(_param);
                    _param = "";
                }else{
                    _param += ",";
                } 
            }
             
            _.forEach(accountParams, function(_accountParams) { 
                console.log("##._accountParams 1=" + _accountParams); 

                var filter =  {
                        filter: [
                            "instance.in." + _accountParams,
                            "snapshot.in." + _snapshotParams,
                        ]
                    }; 
                
                //var query = baseFilters(); 
                var query = _.merge(baseFilters(), filter);
                //query : {count:25000, page:1, filter:["end.ge.1459953000", "end.lt.1460039400"]}
                //query : {count:25000, page:1, filter:[queue.in.1210458a-4145-4f67-a19d-02be24a29fb6,2841930e-e8aa-4eaf-b938-ade7033e8532,32c6532e-2b34-4d06-9873-38c9cc1cddf9"]}

                $rootScope.spinnerActive = true; 

                $scope.status = "Loading ...";  
                reporting.novaQuery("instance/state", query, processInstanceState);    
            }); 
        };
                          
        /**
         * This function is called from _load() in ersa-search directive
         * arg : rangeEpochFilter - filter:["end.ge.1459953000", "end.lt.1460039400"]
         */        
        $scope.load = function(rangeEpochFilter) {
            var allIntance = instances.length;
            if (allIntance == 0) {
                return;
            }    
            
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
            reporting.novaQuery("snapshot", query, processSnapshot);  
        };
        
        var processSnapshot = function(svc, type, query, data) { 
            
            snapshots = util.keyArray(data); 
            
            if (data && data.length > 0) { 

                var allsnapshot = data.length;    
                var _param = "";
                for(var i = 1; i <= allsnapshot; i++){
                    _param += data[i - 1].id ;
                    if( i != allsnapshot){  
                        _param += ",";
                    } 
                }                
                
                loadInstanceState(_param); 
                
            } else { 
                //$rootScope.spinnerActive = false;  
                $scope.status = "Loaded " + "0 snapshots."; 
            } 
        };     
  
                    
        $scope.$on('$viewContentLoaded', function() { 

            $scope.startDateTitle = "Snapshot Start Date";
            $scope.endDateTitle = "Snapshot End Date";
                            
            var startDate = new Date();
            startDate.setDate(startDate.getDate() -1);
            $scope.rangeStart = startDate;
            console.log('viewContentLoaded ...'); 
        });
                                   

    }]);   
});
