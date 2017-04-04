export default function updateMutation(
  mutation, originalOffset, originalLength, newLength, prefixLength, suffixLength
) {
  const lengthDiff = newLength - originalLength;

  // disjoint mutations that happen later on where the offset will need to be changed
  if (originalOffset + originalLength <= mutation.offset) {
    return Object.assign({}, mutation, {
      offset: mutation.offset + lengthDiff,
      prefixLength,
      suffixLength
    });
  }

  // mutation that completely contains the new one, in which case we can just adjust the length
  if (
    originalOffset >= mutation.offset
    && originalOffset + originalLength <= mutation.offset + mutation.length
  ) {
    return Object.assign({}, mutation, {
      length: mutation.length + lengthDiff,
      prefixLength,
      suffixLength
    });
  }

  // mutation that starts from before the new one and contains only a portion of the new one
  if (originalOffset > mutation.offset
    && mutation.offset + mutation.length > originalOffset
    && mutation.offset + mutation.length < originalOffset + originalLength) {
    return Object.assign({}, mutation, {
      length: mutation.length + prefixLength,
      prefixLength,
      suffixLength
    });
  }

  // mutation that starts within the new one and extends beyond
  if (originalOffset < mutation.offset
    && mutation.offset < originalOffset + originalLength
    && mutation.offset + mutation.length > originalOffset + originalLength) {
    return Object.assign({}, mutation, {
      offset: mutation.offset + prefixLength,
      length: mutation.length + suffixLength,
      prefixLength,
      suffixLength
    });
  }

  // mutations that occur partially within the new one.
  if (originalOffset <= mutation.offset && mutation.offset <= originalOffset + originalLength) {
    return Object.assign({}, mutation, {
      offset: mutation.offset + prefixLength,
      prefixLength,
      suffixLength
    });
  }

  return mutation;
}
