// FIXME: can this to include admined parameter for setting up route states?
define({
  "ersa": {
    "HPC": {
      "HPC": ["/hpc/hpc", "HPC"],
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
      "Cloud Summary": ["/admin/cloud/novasummary", "Novasummary"],
    },
    "hideFor3rdMenu": {
      "FileSystem": ["/storage/hnas/fileSystem", "FileSystem"],
      "VirtualVolume": ["/storage/hnas/virtualVolume", "VirtualVolume"],
    }
  },
  "portal": {
    "Reports": {  // menus not states
      "COMPUTING": ["sub1", ["/hpc/hpcsummary", "HPC"],
        ["/cloud/novasummary", "NECTAR"],
      ],
      "STORAGE": ["sub2", ["/storage/hpcStorage", "HOME ACCOUNT"],
        ["/storage/allocationSummary", "NATIONAL"],
        ["/storage/allocationANDSReport", "ANDS REPORT"],
      ],
    },
    "hideFor3rdMenu": { // this data will be registered in 'state'
      "SummaHPry": ["/hpc/hpcsummary", "HPCSummary", "tesla gpu gtx mecheng abraham short gtx3 "],
      "HPC Storage": ["/storage/hpcStorage", "HPCStorage"],
      "Allocation Summary": ["/storage/allocationSummary", "AllocationSummary"],
      "Cloud Summary": ["/cloud/novasummary", "Novasummary"],
      "ANDS Report": ["/storage/allocationANDSReport", "AllocationANDSReport"],
    }
  }
});