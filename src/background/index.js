// SPDX-License-Identifier: AGPL-3.0-or-later

import { defaultRomajiTable, defaultRomajiTableKeys } from '../romajiTable.js';


/* Mode */

/**
 * @readonly
 */
const MODE = /** @type {const} */ ({
  DIRECT: 'Direct Input',
  PRE_CONVERSION: 'Romaji input',
  // KANA: 'Kana input',
  // CONVERSION: 'kana-kanji conversion',
});

// TODO: merge init logic
chrome.input.ime.setMenuItems({
  engineID: 'test-ime',
  items: [{
    id: MODE.DIRECT,
    label: 'Direct input',
    checked: true,
    enabled: true,
  },{
    id: MODE.PRE_CONVERSION,
    label: 'Hiragana'
  }],
});

/**
 * @typedef { typeof MODE[keyof typeof MODE] } ModeVal
 */
class ImeState {
  /**
   * @type { typeof MODE[keyof typeof MODE] } mode
   */
  #mode;

  constructor() {
    this.#mode = MODE.DIRECT;
  }

  /**
   * @param { ModeVal } v
   */
  set mode(v) {
    this.#mode = v;
    chrome.input.ime.updateMenuItems({
      engineID: 'test-ime',
      items: [{
        id: v,
        checked: true,
        enabled: true,
      }],
    });
  }
  get mode() {
    return this.mode;
  }
}

const imeState = new ImeState;

// onMenuItemActivated


/* Context */

let contextID = -1;

/**
 * @type { {
 *  converted: string;
 *   next: string;
 *   raw: Array<string>;
 *   keep: {
 *       raw: string;
 *       kana: string;
 *   };
 * } }
 */
let inputContext = {
  converted: '',
  next: '',
  raw: [],
  keep: {
    raw: '',
    kana: '',
  },
};

const combKeys = {
  Ctrl: false,
  Shift: false,
  // Meta: false,
  Alt: false,
}
const combKeysList = Object.keys(combKeys)


const checkNotInputting = () => inputContext.converted === '' && inputContext.next === '';

const setComposition = () => chrome.input.ime.setComposition({
  contextID,
  text: inputContext.converted + inputContext.next,
  cursor: inputContext.converted.length + inputContext.next.length
});

const clearInputContext = () => {
  inputContext = {
    converted: '',
    raw: [],
    next: '',
    keep: {
      raw: '',
      kana: '',
    },
  };
};

const getMatchingKeysCount = () => defaultRomajiTableKeys.filter(v => v.startsWith(inputContext.next)).length;

/**
 *
 * @param { string | Array<string> } raw
 * @param { string } converted
 */
const addConverted = (raw, converted) => {
  inputContext.converted += converted;
  if(Array.isArray(raw)) {
    inputContext.raw.push(...raw);
  } else {
    inputContext.raw.push(raw);
  }
}


chrome.input.ime.onFocus.addListener((context) => {
  contextID = context.contextID;
});

chrome.input.ime.onBlur.addListener(targetContextID => {
  clearInputContext();
});

chrome.input.ime.onReset.addListener(targetContextID => {
  clearInputContext();
});

chrome.input.ime.onKeyEvent.addListener(
  (_engineID, keyData) => {
    if((keyData.type === 'keydown' || keyData.type === 'keyup') && combKeysList.includes(keyData.key)) {
      combKeys[keyData.key] = keyData.type === 'keydown' ? true : false;
    }

    if(keyData.type === 'keydown') {
      if(combKeys.Ctrl) {
        return false;
      }

      else if(keyData.key === 'Convert') {
        imeState.mode = MODE.PRE_CONVERSION;
        // TODO: popup
        return true;
      }

      else if(keyData.key === 'NonConvert') {
        imeState.mode = MODE.DIRECT;
        return true;
      }

      else if(imeState.mode === MODE.DIRECT) {
        return false;
      }

      else if(keyData.key === 'Enter') {
        if(checkNotInputting()) {
          return false;
        }

        if(inputContext.next !== '') {
          // NOTE: Mozc doesn't convert at this time. ex: 'n' -> 'ん'
          const conv = defaultRomajiTable[inputContext.next];
          addConverted(inputContext.next, conv ? conv[0] : inputContext.next)
        }

        chrome.input.ime.commitText({
          contextID,
          text: inputContext.converted,
        });
        clearInputContext();
      }

      // FIXME: support surrogate pair
      else if(keyData.key === 'Backspace') {
        if(checkNotInputting()) {
          return false;
        }

        if(inputContext.next !== '') {
          inputContext.next = inputContext.next.slice(0, -1);
          setComposition();
          return true;
        }

        if(inputContext.converted !== '') {
          inputContext.converted = inputContext.converted.slice(0, -1);
          inputContext.raw.pop();
          setComposition();
          return true
        }
      }

      // FIXME: impl
      else if(keyData.key === 'Delete') {
        if(checkNotInputting()) {
          return false;
        }

        return true;
      }

      else if(keyData.key.match(/^[A-Z]$/)) {
        const input = inputContext.next + keyData.key;
        addConverted(Array.from(input), input);
        inputContext.next = '';
        setComposition();
        return true;
      }

      else if(keyData.key.match(/^[a-z]$/)) {
        inputContext.next += keyData.key;
        const conv = defaultRomajiTable[inputContext.next];
        if(conv === void 0) {
          if(getMatchingKeysCount() === 0) {
            if(inputContext.keep.kana !== '') {
              addConverted(inputContext.keep.raw, inputContext.keep.kana)
              inputContext.keep = {
                raw: '',
                kana: '',
              };
              inputContext.next = keyData.key;
            }
          }
          if(getMatchingKeysCount() === 0) { // different inputContext.next
            addConverted(Array.from(inputContext.next), inputContext.next);
            inputContext.next = '';
          }
        } else {
          if(getMatchingKeysCount() === 1) {
            addConverted(inputContext.next, conv[0]);
            inputContext.next = conv[1] ?? '';
            inputContext.keep = {
              raw: '',
              kana: '',
            };
          } else {
            inputContext.keep = {
              raw: inputContext.next,
              kana: conv[0],
            };
          }
        }
        setComposition();
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
);
