define(function () {
  var CountdownLatch = function (limit) { // thanks https://gist.github.com/nowelium/1604371
    this.limit = limit
    this.count = 0
    this.waitBlock = function () {}
  }
  CountdownLatch.prototype.countDown = function () {
    this.count = this.count + 1
    if(this.limit <= this.count) {
      return this.waitBlock()
    }
  }
  CountdownLatch.prototype.await = function (callback) {
    this.waitBlock = callback
  }
  return CountdownLatch
})
