export default (r1, r2) => {
  if (r1.offset === r2.offset) {
    return r2.length - r1.length;
  }
  return r1.offset - r2.offset;
};
