// SPDX-License-Identifier: AGPL-3.0-or-later

import { mozcRomanjiHiraganaTable } from './mozcTables/romanji-hiragana.js';

/**
 * @type {Record<string, [string, string|undefined]>}
 */
export const defaultRomajiTable = {
  ...mozcRomanjiHiraganaTable,
};

export const defaultRomajiTableKeys = Object.keys(defaultRomajiTable);
