// @flow

import React from 'react';

export type TagObject = { start: string, end: string };

export type BlockTagObject = {
  start: string,
  end: string,
  empty?: string,
  nestStart?: string,
  nestEnd?: string
};

export type BlockMarkup =
  string |
  React.Element<any> |
  BlockTagObject |
  {| element: React.Element<any>, empty?: React.Element<any>, nest?: React.Element<any> |};

export type NestedBlockMarkup =
  { nest: React.Element<any> } |
  { nestStart: string, nestEnd: string };

export type EntityMarkup =
  string |
  TagObject |
  React.Element<any>;

export type InlineStyleMarkup =
  TagObject |
  React.Element<any>;

export type Markup = BlockMarkup | EntityMarkup | InlineStyleMarkup;
