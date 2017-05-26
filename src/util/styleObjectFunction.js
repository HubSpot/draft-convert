export default object => style => {
  if (typeof object === 'function') {
    return object(style);
  }

  return object[style];
};
