define({
  nova: {
    domains: ["Flinders", "Adelaide", "UniSA"],
    pickers: [{
      title: 'Start',
      class: 'col-md-3',
      date: new Date(Date.now() - 86400000)
    }, {
      title: 'End',
      class: 'col-md-3',
      date: new Date()
    }],
    size: 10,
    price: 120
  },
  domains: {
    'unisa.edu.au': 'University of South Australia',
    'adelaide.edu.au': 'University of Adelaide',
    'flinders.edu.au': 'Flinders University'
  },
  hpc: {
    IncompleteMonth: 'The cost of current month is not accurate.',
  },
  slurm: {
    partitions: {
      exclude: ['ccb']
    }
  },
  "hpchome": {
    "comment": "Hpchome has been drafted as a product: HPC home storage,\
                but frontend does not use it. \
                And it is absorbed into Slurm (Tango Compute) from \
                2018 July",
    "price": 5,
    "lastReportMonth": {
      "date": new Date(2018, 5, 30),
      "message": "From July 2018, HPC home is charged as part of Tango Compute"
    }
  },
  "product-composition": {
    "tangocloudvm": {
      "start-date": 1522503000,
      "core": "tangovmcpunotforsale",
      "ram": "tangovmmemorynotforsale"
    }
  }
});
