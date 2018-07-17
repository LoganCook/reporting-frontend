// FIXME: can this to include admined parameter for setting up route states?
// FIXME: this file contains menu items for MenuController called in index.html and
//        it also contains some (ersa) states for route.js to create routes.
//        Some states are detached from menu items and defined in hideFor3rdMenu
define({
  "ersa": {
    "HPC": {
      "HPC": ["/hpc/hpc", "HPC"],
      "Tango": ["/admin/hpc/slurm", "Slurm"],
      "Summary": ["/admin/hpc/hpcsummary", "HPCSummary"],
    },
    "Storage": {
      //"Filesystem": ["/storage/fs", "Filesystem"],
      "XFS": ["/storage/xfs", "XFS"],
      "Home Account": ["/admin/storage/hpcStorage", "AHPCStorage"],
      //"HNAS": ["/storage/hnas", "HNAS"],
      "HNAS": ["sub", ["/storage/hnas/fileSystem", "FileSystem"],
        ["/storage/hnas/virtualVolume", "VirtualVolume"],
      ],
      //"HNAS/FileSystem": ["/storage/hnas/fileSystem", "FileSystem"],
      //"HNAS/VirtualVolume": ["/storage/hnas/virtualVolume", "VirtualVolume"],
      "HCP": ["/storage/hcp", "HCP"],
      "National": ["/admin/storage/allocationSummary", "AAllocationSummary"],
      "RDS Report": ["/admin/storage/allocationRDSReport", "AAllocationRDSReport"],
    },
    "Cloud": {
      "Identity (Keystone)": ["/cloud/keystone", "Keystone"],
      "Virtual Machines (Nova)": ["/nova"],
      "Nectar Summary": ["/admin/cloud/novasummary", "Novasummary"],
      "Tango Summary": ["/admin/cloud/tangosummary", "TangoCloudsummary"],
    },
    "hideFor3rdMenu": {
      "FileSystem": ["/storage/hnas/fileSystem", "FileSystem"],
      "VirtualVolume": ["/storage/hnas/virtualVolume", "VirtualVolume"],
    }
  },
  "portal": {
    "Reports": { // menus not states, first element is the uri of a state
      "COMPUTING": [
        "sub1",
        ["/hpc/slurm", "HPC - Tango"],
        ["/hpc/hpcsummary", "HPC - Tizard"],
        ["/cloud/novasummary", "Cloud - NECTAR"],
        ["/cloud/tangosummary", "Cloud - Tango"]
      ],
      "STORAGE": [
        "sub2",
        ["/storage/hpcStorage", "HOME ACCOUNT"],
        ["/storage/allocationSummary", "NATIONAL"],
        ["/storage/allocationANDSReport", "STORED COLLECTIONS"]
      ]
    },
    // this data will be registered as states, keys are not used, just used as a reminder for coder
    // the first element has to match to the first element of a menu item
    "hideFor3rdMenu": {
      "HPC - Tizard": ["/hpc/hpcsummary", "HPCSummary", "tesla gpu gtx mecheng abraham short gtx3 "],
      "HPC - Tango": ["/hpc/slurm", "Slurm"],
      "HPC Storage": ["/storage/hpcStorage", "HPCStorage"],
      "Allocation Summary": ["/storage/allocationSummary", "AAllocationSummary"],
      "Nectar Summary": ["/cloud/novasummary", "Novasummary"],
      "Tango Cloud Summary": ["/cloud/tangosummary", "TangoCloudsummary"],
      "ANDS Report": ["/storage/allocationANDSReport", "AllocationANDSReport"],
    }
  }
});