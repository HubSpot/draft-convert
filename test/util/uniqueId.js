let nextId = 0;

export default () => {
  nextId++;
  return nextId - 1;
};
