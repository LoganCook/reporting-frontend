define({ 
    "hpc.queues": "tesla gpu tizard mecheng abraham short gtx3",

    "nova.domains": [{"id": 1, "name":"Flinders"}, 
                     {"id": 2, "name":"Adelaide"}, 
                     {"id": 3, "name":"UniSA"}], 
    "nova.availability.zone": "sa ",//SA Only
    
    "allocation.summary.invisible.filesystem": [
                     "commvault-test-sb", 
                     "ersa-backups", 
                     "ersa-ckan-dev", 
                     "ersa-ckan-test", 
                     "ersa-cloud-aptmirror", 
                     "ersa-drop", 
                     "ersa-mediafluxtest-mig", 
                     "ersa-mediafluxtest-nomigration", 
                     "ersa-storage-home", 
                     "ersa-tau", 
                     "test-data-intranet", 
                     "vmware-swing-lun", 
                     "ersa-vmfs-backup", 
                     "ersa-vmware-backup", 
                     "livearcdata", 
                     "ersa-ckan-prod-app", 
                     "ersa-ckan-prod-backup", 
                     "ersa-cml-earth", 
                     "ersa-cml-tizarddeploy", 
                     "ersa-uofa-ag-plantdb-plantdb-6", 
                     "ersa-uofa-ag-plantdb-tpa_backup-6", 
                     "ersa-uofa-ag-plantdb-zegami-6", 
                     "SD_FS_01", 
                     "SD_FS_02"], 
    
});
