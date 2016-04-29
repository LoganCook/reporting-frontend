define(["app", "lodash", "mathjs","../util"], function(app, _, math, util) {
    app.controller("NovaController", ["$rootScope", "$scope", "$timeout", "reporting", "$uibModal", "org",
    function($rootScope, $scope, $timeout, reporting, $uibModal, org) {
  
        //only sa zone 
        var saZonefilter =  {filter: ["availability_zone.in.6e2fcd7c-63a9-4f03-a2f8-cd545366de82"]}; 

        $scope.values = _.values;

        $scope.formatTimestamp = util.formatTimeSecStamp;
        $scope.formatNumber = util.formatNumber;
        $scope.formatDuration = util.formatDuration;
        $scope.alerts = []; 

        $scope.selectedDomain = ''; 
        $scope.selectedSnapshot = '';
        
        $scope.cache = {}; 
        $scope.cache.instancesState = [];
        
        $scope.domains = [{"id": 1, "name":"Flinders"},
                          {"id": 2, "name":"Adelaide"},
                          {"id": 3, "name":"UniSA"}];  
        $scope.instances = {};  
          
        var keystone = {memberships : [] };   
        var instances = {};    
        var snapshots= {};    
        var azs = {}; 
        var hypervisors = {}; 
        var flavors= {};   
        
        var instanceSummary = {};   
        
        var baseFilters = function() {
            return {
                count: 500,
                page: 1
            };
        }; 
   
        var clear = function() {    
            snapshots= {};    
            $scope.status = "Zero instances loaded.";  
            $scope.selectedDomain = ''
            $scope.instancesState = []; 
             
            $scope.cache = {}; 
            $scope.cache.instancesState = [];
            
            instanceSummary = {}; 
        }; 


        // Keystone data
        var initKeystone = function() {  
            reporting.novaBase(processInitData); 
             
            var query = { order:"-ts", count : 1};
            reporting.keystoneQuery("snapshot", query, processKeystoneSnapshot);
        };

        var processKeystoneSnapshot = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                var snapshotId = data[0].id;  
                var query = { count: 10000, page:1, filter: ["snapshot.in." + snapshotId]}; 
                reporting.keystoneQuery("membership", query, processKeystoneMembership);
            } else { 
                $scope.status = "Keystone Snapshot: " + $scope.jobCount; 
            } 
        };


        var processKeystoneMembership = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                
                Array.prototype.push.apply(keystone.memberships,  data);  
                $scope.status = "Loaded " + data.length + " membership."; 
                
                loadKeystoneAccountTenant(data);
                
                $rootScope.spinnerActive = false;
                  
                var next = util.nextPage(query);
 
                reporting.keystoneQuery("membership", next, processKeystoneMembership);
            } else {
                //$scope.status = "Jobs: " + $scope.jobCount;
                $rootScope.spinnerActive = false;
            } 
        };
                
        var loadKeystoneAccountTenant = function(memberships) {  
            var fetchingcount = 1000;
            var allmemberships = memberships.length;
            var accountParams = [];
            var _account = ""; 
            var tenantParams = [];
            var _tenant = ""; 
            
            for(var i = 1; i <= allmemberships; i++){
                _account += memberships[i - 1].account;
                _tenant  += memberships[i - 1].tenant;
                if(i % fetchingcount == 0){
                    accountParams.push(_account);
                    tenantParams.push(_tenant);
                    _account = "";
                    _tenant = "";
                }else{
                    _account += ",";
                    _tenant += ",";
                }
            } 
            
            if(_account != ""){
                accountParams.push(_account.replace(/,\s*$/, ""));//remove last comma"
                tenantParams.push(_tenant.replace(/,\s*$/, ""));//",0"
            }
            
            for(var i = 1; i <= accountParams.length; i++){ 
                var query =  {count:fetchingcount + 10, filter: ["id.in." + accountParams[i - 1]]}; 
                 
                $rootScope.spinnerActive = true; 

                $scope.status = "Loading ...";  
                reporting.keystoneQuery("account", query, processKeystoneAccount);    
            } 
            
            for(var i = 1; i <= tenantParams.length; i++){ 
                var query =  {count:fetchingcount + 10, filter: ["id.in." + tenantParams[i - 1]]}; 
                 
                $rootScope.spinnerActive = true; 

                $scope.status = "Loading ...";  
                reporting.keystoneQuery("tenant", query, processKeystoneTenant);    
            } 
        };
        
        var processKeystoneAccount = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                 
                $scope.status = "Loaded " + data.length + " membership."; 
                
                var accounts = util.keyArray(data);  
                
                _.forEach(keystone.memberships, function(_membership) { 
                    if (_membership.account in accounts) { 
                        _membership.account_openstack = accounts[_membership.account].openstack_id; 
                    }     
                }); 
            } else { 
                $rootScope.spinnerActive = false;
            } 
        };
        
        
        var processKeystoneTenant = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                 
                $scope.status = "Loaded " + data.length + " tenent."; 
                
                var tenants = util.keyArray(data);  
                
                _.forEach(keystone.memberships, function(_membership) { 
                    if (_membership.tenant in tenants) { 
                        _membership.tenant_openstack = tenants[_membership.tenant].openstack_id; 
                        _membership.allocation = tenants[_membership.tenant].allocation; 
                        _membership.name = tenants[_membership.tenant].name; 
                        _membership.description = tenants[_membership.tenant].description; 
                    }     
                }); 
            } else {
                //$scope.status = "Jobs: " + $scope.jobCount;
                $rootScope.spinnerActive = false;
            } 
        }; 
        
        clear();
        initKeystone(); 
        
        // Nova data
        var processInitData = function(svc, type, data) {  
            if (type == "instance/status") {   
                $scope.instancesStatus  = util.keyArray(data);  
            }else if (type == "az") {  
                azs  = util.keyArray(data);  
            }else if (type == "hypervisor") {  
                hypervisors  = util.keyArray(data);   
            }else if (type == "flavor") {  
                flavors  = util.keyArray(data);  
            }  
        }; 

        var processInstance = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                 
                loadNovaAccountTenant(data); 
                Array.prototype.push.apply(instances,  data);   
                var next = util.nextPage(query);
 
                reporting.novaQuery("instance", next, processInstance);
            } else { 
                //$rootScope.spinnerActive = false; 
            } 
        };


        var loadNovaAccountTenant = function(data) {  
            var fetchingcount = 100;
            var allinstances = data.length;
            var accountParams = [];
            var _account = ""; 
            var tenantParams = [];
            var _tenant = ""; 
            
            for(var i = 1; i <= allinstances; i++){ 
                _account += data[i - 1].account;
                _tenant  += data[i - 1].tenant;
                if(i % fetchingcount == 0){
                    accountParams.push(_account);
                    tenantParams.push(_tenant);
                    _account = "";
                    _tenant = "";
                }else{
                    _account += ",";
                    _tenant += ",";
                }  
            }  

            if(_account != ""){
                accountParams.push(_account.replace(/,\s*$/, ""));//remove last comma"
                tenantParams.push(_tenant.replace(/,\s*$/, ""));//",0"
            } 
                    
            for(var i = 1; i <= accountParams.length; i++){ 
                var query =  {count:fetchingcount + 10, filter: ["id.in." + accountParams[i - 1]]}; 
                 
                $rootScope.spinnerActive = true; 

                $scope.status = "Loading ...";  
                reporting.novaQuery("account", query, processNovaAccount);    
            } 
            
            for(var i = 1; i <= tenantParams.length; i++){ 
                var query =  {count:fetchingcount + 10, filter: ["id.in." + tenantParams[i - 1]]}; 
                 
                $rootScope.spinnerActive = true; 

                $scope.status = "Loading ...";  
                reporting.novaQuery("tenant", query, processNovaTenant);    
            } 
        };
         
        var processNovaAccount = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                 
                $scope.status = "Loaded " + data.length + " membership."; 
                
                var accounts = util.keyArray(data);  
                
                _.forEach(instances, function(_instance) { 
                    if (_instance.account in accounts) { 
                        _instance.account_openstack = accounts[_instance.account].openstack_id; 
                    } 
                });  
            } else { 
                $rootScope.spinnerActive = false;
            } 
        };
        
        
        var processNovaTenant = function(svc, type, query, data) { 
            
            if (data && data.length > 0) {  
                 
                $scope.status = "Loaded " + data.length + " tenant."; 
                
                var tenants = util.keyArray(data);  
                
                _.forEach(instances, function(_instance) { 
                    if (_instance.tenant in tenants) {  
                        _instance.tenant_openstack = tenants[_instance.tenant].openstack_id;  
                    }     
                }); 
            } else {
                //$scope.status = "Jobs: " + $scope.jobCount;
                $rootScope.spinnerActive = false;
            } 
        };
         
        var initNova = function() {  
            reporting.novaBase(processInitData); 
             
            var query = _.merge(baseFilters(), saZonefilter);
            //var query = baseFilters();
            reporting.novaQuery("instance", query, processInstance);
        };


        initNova();
   
        $scope.domainChanged = function() { 
            //$scope.instancesState = mapInstanceState($scope.cache.instancesState);  
        }; 
             
        var mapInstanceState = function(data) {  
            
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
        
                
        var processInstanceState = function(svc, type, query, data) { 
            
            if (data && data.length > 0) { 
                Array.prototype.push.apply($scope.cache.instancesState, data); 
                
                mapInstanceState(data);
                $scope.instancesState = _.values(instanceSummary);
                //Array.prototype.push.apply($scope.instancesState, _mappedData); 
                $scope.status = "Loaded " + $scope.cache.instancesState.length + " instances states."; 
                
                $rootScope.spinnerActive = false;
                  
                var next = util.nextPage(query);
 
                reporting.novaQuery("instance/state", next, processInstanceState);
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
            // mergy instance data with keystone data
            var memberships = util.multiKeyArray(keystone.memberships, "account_openstack", "tenant_openstack"); 
            _.forEach(instances, function(_instances) {
            
                if ((_instances.account_openstack + _instances.tenant_openstack) in memberships) {
                    _instances.tenant_allocation = memberships[_instances.account_openstack + _instances.tenant_openstack].allocation; 
                    _instances.tenant_name = memberships[_instances.account_openstack + _instances.tenant_openstack].name; 
                    _instances.tenant_description = memberships[_instances.account_openstack + _instances.tenant_openstack].description; 
                }
            });
             
            $scope.instances = util.keyArray(instances); 
            
            // fetch instance state
            var allIntance = instances.length;
            var instanceParams = [];
            var _param = "";
            for(var i = 1; i <= allIntance; i++){
 
                var filter =  {
                        filter: [
                            "instance.in." + instances[i - 1].id,
                            "snapshot.in." + _snapshotParams,
                        ]
                    }; 
                
                var query = _.merge(baseFilters(), filter);
                //query : {count:25000, page:1, filter:[queue.in.1210458a-4145-4f67-a19d-02be24a29fb6,2841930e-e8aa-4eaf-b938-ade7033e8532,32c6532e-2b34-4d06-9873-38c9cc1cddf9"]}

                $rootScope.spinnerActive = true; 

                $scope.status = "Loading ...";  
                reporting.novaQuery("instance/state", query, processInstanceState);    
            }
        };

         
        var loadAccounts = function(_snapshotParams) {   
 
            var allIntance = instances.length;    
            for(var i = 1; i <= allIntance; i++){ 

                var filter =  {
                        filter: [
                            "instance.in." + instances[i - 1].id ,
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
            }
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
                
            /// Assign hypervisors ////
            _.forEach(hypervisors, function(_hypervisor) {   
                if (_hypervisor.availability_zone in azs) { 
                    //_hypervisor["azname"] = $scope.azs[_hypervisor.availability_zone].name;
                }
            }); 
            
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
            var endDate = new Date();
            startDate.setDate(startDate.getDate() -1);
            $scope.rangeStart = startDate;
            //endDate.setDate(endDate.getDate() -82);
            //$scope.rangeEnd = endDate;
            console.log('viewContentLoaded ...'); 
        });
                                   

    }]);   
});
