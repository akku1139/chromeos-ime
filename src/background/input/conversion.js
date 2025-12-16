// SPDX-License-Identifier: AGPL-3.0-or-later

import { findAllMatchedToken } from '../../converter/index.js';
import { ime, INPUT_MODE } from '../contextManager.js';
import { dict } from '../../dict/index.js';

/**
 * @typedef { {
 *    children: () => ConvTreeNode,
 *    end: boolean,
 *    matched: Array<string>,
 *    rest: string,
 * } } ConvTreeLeaf
 * @typedef { Map<string, ConvTreeLeaf> } ConvTreeNode
 * @type { ConvTreeNode }
 */
let convTree = new Map();
/**
 * @type { Map<string, ConvTreeNode> }
 */
const convTreeCache = new Map(); // 同じchildrenが生成されるときにキャッシュしておくと良い気がした

/**
 * @param { string } fullString
 * @param { string } prefixToRemove
 */
const removePrefix = (fullString, prefixToRemove) => {
  const lengthToRemove = prefixToRemove.length;
  return fullString.slice(lengthToRemove);
};

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
      const rest = removePrefix(target, r[0]);
      // 現在のトークンをdictから取得
      const dictMatched = [...dict.get(r[0])?.target ?? [], ...dict.get(r[0]+r[1])?.target ?? []];
      // 残りが0だったらendフラグ
      node.set(r[0], {
        children: buildConvTreeNode(rest, targetRaw.slice(target.length-rest.length)),
        end: rest.length === 0,
        matched: dictMatched,
        rest,
      });
    }

    return node;
  };
}

const currentCandidates = new (class {
  constructor() {
    this.candidates = []; // とりあえず
  }

  currentIndex = 0;
  /**
   * @type { ReturnType<typeof getCandidates> }
   */
  candidates;

  inc() {
    if(this.currentIndex+1 < this.candidates.length) this.currentIndex++;
    else this.currentIndex = 0;
  }

  selected() {
    return this.candidates[this.currentIndex];
  }
});

/**
 * 副作用あり、currentCandidatesをリセットする
 */
const getCandidates = () => {
  /**
   * @type { Array<{
   *    id: number,
   *    candidate: string,
   *    node: ConvTreeLeaf,
   * }> }
   */
  let res = [];
  let id = 0;
  convTree.entries().forEach(n => {
    for(const m of n[1].matched) {
      res.push({
        id,
        candidate: m,
        node: n[1],
      });
      ++id;
    }
  });
  currentCandidates.candidates = res;
  currentCandidates.currentIndex = 0;
  return res;
};

const setComposition = () => {
  const current = currentCandidates.selected();
  if(current===void 0) return
  // FIXME: 未変換分も入れる
  chrome.input.ime.setComposition({
    contextID: ime.activeContext.systemContext.contextID,
    text: current.candidate + current.node.rest,
    cursor: current.candidate.length,
  });
};

/**
 * @type { InputMode }
 */
export const conversion = {
  init() {
    convTree.clear();

    // const res = findAllMatchedToken(ime.activeContext.kana.converted, ime.activeContext.kana.raw).toReversed();

    convTree = buildConvTreeNode(ime.activeContext.kana.converted, ime.activeContext.kana.raw)();

    // FIXME: everything
    chrome.input.ime.setCandidates({
      contextID: ime.activeContext.systemContext.contextID,
      // candidates: [...res.map((r, i) => ({ candidate: r[0], id: i }))],
      candidates: getCandidates(),
    });
    chrome.input.ime.setCandidateWindowProperties({
      engineID: ime.engineID,
      properties: {
        visible: true,
        vertical: true,
      },
    });
  },

  cleanup() {
    chrome.input.ime.setCandidateWindowProperties({
      engineID: ime.engineID,
      properties: {
        visible: false,
      },
    });

    convTree.clear();
  },

  keydown(key) {
    if(key.ctrlKey) {
      return false;
    }

    else if(key.key === ' ') {
      currentCandidates.inc();
    }

    else if(key.key === 'Enter') {
      const cur = currentCandidates.selected();
      chrome.input.ime.commitText({
        contextID: ime.activeContext.systemContext.contextID,
        text: cur.candidate,
      });

      if(cur.node.end)
        ime.activeInputMode = INPUT_MODE.PRE_CONVERSION;
      else {
        convTree = cur.node.children();
        chrome.input.ime.setCandidates({ // FIXME: 重複
          contextID: ime.activeContext.systemContext.contextID,
          candidates: getCandidates(),
        });
      }
    }

    else if(key.key === 'Backspace') {
      ime.activeInputMode = INPUT_MODE.PRE_CONVERSION;
    }

    setComposition();

    return true;
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
