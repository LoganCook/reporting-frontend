
define({
        "REPORT": {
            "COMPUTING": ["sub",  ["/storage/hpcStorage", "HPC"], ["/cloud/novasummary", "NECTAR"],], 
            "HCP": ["sub",["/hpc/hpcsummary", "HPC", "tesla gpu gtx mecheng abraham short gtx3 "], ["/storage/allocationSummary", "Allocation"],], 
        },
        "Cloud": {
            "Identity (Keystone)": ["/cloud/keystone", "Keystone"],
            "Virtual Machines (Nova)": ["nova"], 
        } 
});
