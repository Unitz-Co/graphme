const hooksContainer = new WeakMap();
const getHooksContainer = (inst) => {
  if (!hooksContainer.has(inst)) {
    hooksContainer.set(inst, {});
  }
  return hooksContainer.get(inst);
};

const isDepsChanged = () => {
  return false;
};

const hooks = {
  useMemo(name, memoFn, deps) {
    const hooks = getHooksContainer(this);
    if (!hooks[name] || isDepsChanged(deps)) {
      hooks[name] = memoFn();
    }
    return hooks[name];
  },
  useCallback(name, cb, deps) {},
};

module.exports = hooks;
