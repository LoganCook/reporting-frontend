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
    size: 10
  }
});
