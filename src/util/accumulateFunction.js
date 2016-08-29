export default (newFn, rest) => (...args) => {
  const newResult = newFn(...args);
  if (newResult !== undefined && newResult !== null) {
    return newResult;
  }

  return rest(...args);
};
