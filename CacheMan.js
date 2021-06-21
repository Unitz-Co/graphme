class CacheMan {
  initer = null;
  map = {};
  constructor(options) {
    const { initer, getId } = options || {};
    if (typeof initer !== 'function') {
      throw Error('[CacheMan] missing initer function in constructor');
    }
    if (typeof getId !== 'function') {
      throw Error('[CacheMan] missing getId function in constructor');
    }
    this.initer = initer;
    this.getId = getId;
  }

  get(item) {
    const id = this.getId(item);
    if (!id) {
      // id could not found in item, apply initer to the item without caching
      return this.initer(item);
    }
    if (!this.map[id]) {
      this.map[id] = this.initer(item);
    }
    return this.map[id];
  }
}

module.exports = CacheMan;
