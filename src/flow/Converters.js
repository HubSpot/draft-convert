// @flow

import type { InlineStyleMarkup } from './Markup';

export type Converter<A, B> = (A) => B;

export type InlineStyleConverter = Converter<string, ?InlineStyleMarkup>;
