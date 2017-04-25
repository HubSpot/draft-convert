// @flow

export type Mutation = {
  offset: number,
  length: number
};

export type InlineStyleRange = {|
  offset: number,
  length: number, // TODO: switch to spread syntax when https://github.com/babel/babel/pull/5653 lands
  style: string
|};

export type EntityRange = {|
  offset: number,
  length: number, // TODO: switch to spread syntax when https://github.com/babel/babel/pull/5653 lands
  key: string
|};

export type AnyMutation = EntityRange | InlineStyleRange;
