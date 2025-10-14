// SPDX-License-Identifier: AGPL-3.0-or-later

import { findAllMatchedToken } from '../../converter/index.js';
import { ime, INPUT_MODE } from '../contextManager.js';

/**
 * @typedef { Map<[string, string], {
 *    children: () => ConvTreeNode,
 *    end: boolean,
 *  }> } ConvTreeNode
 * @type { ConvTreeNode }
 */
const convTree = new Map();

/**
 * @type { Array<[string, string]> }
 */
let convSelected = [];

/**
 * @param { string } fullString
 * @param { string } prefixToRemove
 */
const removePrefix = (fullString, prefixToRemove) => {
  const lengthToRemove = prefixToRemove.length;
  return fullString.slice(lengthToRemove);
}

/**
 * @type { InputMode }
 */
export const conversion = {
  init() {
    convTree.clear();

    const res = findAllMatchedToken(ime.activeContext.kana.converted, ime.activeContext.kana.raw).toReversed();

    for(const r of res) {
      let data = convTree.get(r);
      if(!data) {
        const prefixRemoved = removePrefix(ime.activeContext.kana.converted, r[0]);
        data = {
          children: (() => {
            return () => {
              // return new Map()
            }
          })(),
          end: prefixRemoved === '',
        };
        convTree.set(r, data);
      }
    }

    // FIXME: everything
    chrome.input.ime.setCandidates({
      contextID: ime.activeContext.systemContext.contextID,
      candidates: [...res.map((r, i) => ({ candidate: r[0], id: i }))],
    });
    chrome.input.ime.setCandidateWindowProperties({
      engineID: ime.engineID,
      properties: {
        visible: true,
        vertical: true,
      }
    });
  },

  cleanup() {
    convTree.clear();

    chrome.input.ime.setCandidateWindowProperties({
      engineID: ime.engineID,
      properties: {
        visible: false,
      }
    });
  },

  keydown(key) {
    if(key.ctrlKey) {
      return false;
    }

    else if(key.key === ' ') {

      return true;
    }

    else if(key.key === 'Enter') {
      ime.activeInputMode = INPUT_MODE.PRE_CONVERSION;
      return true;
    }

    else if(key.key === 'Backspace') {
      ime.activeInputMode = INPUT_MODE.PRE_CONVERSION;
      return true;
    }

    return false;
  }
};

/**
 * @type { Parameters<typeof chrome.input.ime.onCandidateClicked.addListener>[0] }
 */
export const onCandidateClickedListener = (engineID, candidateID, button) => {
  if(engineID !== ime.engineID) {
    throw new Error(`CandidateClicked for non-active engine`);
  }

  // FIXME: impl
};
