import updateMutation from '../../src/util/updateMutation';

describe('updateMutation', () => {
  it('handles disjoint mutations that happens later', () => {
    const mutation = {
      offset: 281,
      length: 4,
    };
    const originalOffset = 246;
    const originalLength = 13;
    const newLength = 67;
    const prefixLength = 50;
    const suffixLength = 4;

    const mutated = updateMutation(
      mutation,
      originalOffset,
      originalLength,
      newLength,
      prefixLength,
      suffixLength
    );

    expect(mutated.offset).toBe(335);
    expect(mutated.length).toBe(4);
  });

  it('handles mutation that completely contains the new one', () => {
    const mutation = {
      offset: 246,
      length: 13,
    };
    const originalOffset = 246;
    const originalLength = 13;
    const newLength = 67;
    const prefixLength = 50;
    const suffixLength = 4;

    const mutated = updateMutation(
      mutation,
      originalOffset,
      originalLength,
      newLength,
      prefixLength,
      suffixLength
    );

    expect(mutated.offset).toBe(246);
    expect(mutated.length).toBe(67);
  });

  it('handles mutation that starts from before the new one and contains only a portion of the new one', () => {
    const mutation = {
      offset: 216,
      length: 67,
    };
    const originalOffset = 246;
    const originalLength = 73;
    const newLength = 127;
    const prefixLength = 50;
    const suffixLength = 4;

    const mutated = updateMutation(
      mutation,
      originalOffset,
      originalLength,
      newLength,
      prefixLength,
      suffixLength
    );

    expect(mutated.offset).toBe(216);
    expect(mutated.length).toBe(117);
  });

  it('handles mutation that starts within the new one and extends beyond', () => {
    const mutation = {
      offset: 281,
      length: 67,
    };
    const originalOffset = 246;
    const originalLength = 73;
    const newLength = 127;
    const prefixLength = 50;
    const suffixLength = 4;

    const mutated = updateMutation(
      mutation,
      originalOffset,
      originalLength,
      newLength,
      prefixLength,
      suffixLength
    );

    expect(mutated.offset).toBe(331);
    expect(mutated.length).toBe(71);
  });

  it('handles mutations that occur partially within the new one', () => {
    const mutation = {
      offset: 246,
      length: 13,
    };
    const originalOffset = 246;
    const originalLength = 73;
    const newLength = 127;
    const prefixLength = 50;
    const suffixLength = 4;

    const mutated = updateMutation(
      mutation,
      originalOffset,
      originalLength,
      newLength,
      prefixLength,
      suffixLength
    );

    expect(mutated.offset).toBe(296);
    expect(mutated.length).toBe(13);
  });
});
