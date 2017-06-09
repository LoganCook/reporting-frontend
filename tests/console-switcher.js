define(function () {
  var origConsole = console
  return {
    consoleOff: function () {
      // stops the test logs from being flooded when we know errors are going to be logged
      console = { error: function () { } }
    },
    consoleOn: function () {
      console = origConsole
    }
  }
})
