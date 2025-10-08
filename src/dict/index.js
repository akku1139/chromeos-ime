// SPDX-License-Identifier: AGPL-3.0-or-later

import { skk_jisho_s } from '../external/skk-dict/loader.js';

/**
 * @type { Dict }
 */
export const dict = skk_jisho_s;

/**
 * @type { DictTreeNode }
 */
export const dictTree = new Map();

for(const key of dict.keys()) {
  let targetNode = dictTree;
  Array.from(key).forEach((e, i, a) => {
    let newData = targetNode.get(e);
    if(!newData) {
      newData = {
        children: new Map(),
        end: false,
      }
    }
    newData.end = newData.end || i === a.length-1;
    targetNode.set(e, newData);
    targetNode = newData.children;
  })
}
