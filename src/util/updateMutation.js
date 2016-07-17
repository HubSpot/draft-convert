export default function updateMutation(mutation, originalOffset, originalLength, newLength) {
  // two cases we can reasonably adjust - disjoint mutations that
  // happen later on where the offset will need to be changed, and
  // mutations that completely contain the new one where we can adjust
  // the length.
  const lengthDiff = newLength - originalLength;

  if (originalOffset + originalLength <= mutation.offset) {
    return Object.assign({}, mutation, {
      offset: mutation.offset + lengthDiff
    });
  }
  if (originalOffset >= mutation.offset && originalOffset + originalLength <= mutation.offset + mutation.length) {
    return Object.assign({}, mutation, {
      length: mutation.length + lengthDiff
    });
  }

  return mutation;
}
