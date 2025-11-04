// SPDX-License-Identifier: AGPL-3.0-or-later

import { findAllMatchedToken } from '../../converter/index.js';
import { ime, INPUT_MODE } from '../contextManager.js';
import { dict } from '../../dict/index.js';

/**
 * @typedef { Map<string, {
 *    children: () => ConvTreeNode,
 *    end: boolean,
 *  }> } ConvTreeNode
 * @type { ConvTreeNode }
 */
const convTree = new Map();
/**
 * @type { Map<string, ConvTreeNode> }
 */
const convTreeCache = new Map();

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
 * @param { string } target
 * @param { Array<string> } targetRaw
 */
const buildConvTreeNode = (target, targetRaw) => {
  return () => {
    /**
     * @type { ConvTreeNode }
     */
    const node = new Map();

    // マッチするトークンを取得
    const res = findAllMatchedToken(target, targetRaw).toReversed();

    for(const r of res) {
      // 残りの未変換文字列を取得
      const rest = removePrefix(r[0], target);
      // 現在のトークンをdictから取得
      const dictMatched = [...dict.get(r[0])?.target ?? [], ...dict.get(r[0]+r[1])?.target ?? []];
      // 残りが0だったらendフラグ
      for(const m of dictMatched) {
        node.set(m, {
          children: buildConvTreeNode(rest, targetRaw.slice(target.length-rest.length)),
          end: rest.length === 0,
        });
      }
    }

    return node;
  };
}

/**
 * @type { InputMode }
 */
export const conversion = {
  init() {
    convTree.clear();

    const res = findAllMatchedToken(ime.activeContext.kana.converted, ime.activeContext.kana.raw).toReversed();

    const data = buildConvTreeNode(ime.activeContext.kana.converted, ime.activeContext.kana.raw);

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
