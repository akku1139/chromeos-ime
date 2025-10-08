// SPDX-License-Identifier: AGPL-3.0-or-later

import { mozcRomanjiHiraganaTable } from './external/mozc/keyTable/romanji-hiragana.js';

/**
 * @type {Record<string, readonly [string, string?]>}
 */
export const defaultRomajiTable = {
  ...mozcRomanjiHiraganaTable,
};

export const defaultRomajiTableKeys = Object.keys(defaultRomajiTable);
