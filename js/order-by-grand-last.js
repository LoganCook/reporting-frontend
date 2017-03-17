define(function () {
  /**
   * A comparator for ensuring that the "Grand" row comes last.
   * @param {{organisation: string}} v1 - first object
   * @param {{organisation: string}} v2 - second object
   * @return {int} sort order the ensures "Grand" comes last but is indifferent to everything else
   */
  return function(v1, v2) {
    if (v1.organisation === 'Grand') {
      return 1
    }
    return 0
  }
})
