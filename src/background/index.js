// SPDX-License-Identifier: AGPL-3.0-or-later

import { defaultRomajiTable, defaultRomajiTableKeys } from '../romajiTable.js';
import { findAllMatchedToken } from '../converter/index.js';


const commitText = () => {
  if(inputContext.next !== '') {
    // NOTE: Mozc doesn't convert at this time. ex: 'n' -> 'ん'
    // const conv = defaultRomajiTable[inputContext.next];
    // addConverted(inputContext.next, conv ? conv[0] : inputContext.next)
    addConverted(inputContext.next, inputContext.next)
  }

  const converted = inputContext.converted;
  const raw = inputContext.raw;

  chrome.input.ime.commitText({
    contextID,
    text: inputContext.converted,
  });
  clearInputContext();

  return [converted, raw];
};

/* Mode */

/**
 * @readonly
 */
const MODE = /** @type {const} */ ({
  DIRECT: 'Direct Input',
  PRE_CONVERSION: 'Hiragana',
  // KANA: 'Kana input',
});

/**
 * @typedef { typeof MODE[keyof typeof MODE] } ModeVal
 */
class ImeState {
  /**
   * @type { ModeVal }
   */
  #_mode;

  /**
   * @type { boolean }
   */
  #_conversion;


  constructor() {
    this.#_mode = MODE.DIRECT;
    this.#_conversion = false;
  }

  /**
   * @param { ModeVal } v
   */
  set mode(v) {
    this.#_mode = v;
    commitText();
    this.conversion = false;
    chrome.input.ime.updateMenuItems({
      engineID: 'test-ime-us',
      items: this.menuItems,
    });
  }
  get mode() {
    return this.#_mode;
  }

  /**
   * @returns { Array<chrome.input.ime.MenuItem> }
   */
  get menuItems() {
    return Object.values(MODE).map(mode => ({
      id: mode,
      label: mode,
      enabled: this.#_mode === mode,
      checked: this.#_mode === mode,
    }));
  }

  /**
   * @param { boolean } v
   */
  set conversion(v) {
    if(this.#_conversion === true && v === false) {
      commitText();
    } else {
      // FIXME: duplicate with commitText
      if(inputContext.next !== '') {
        addConverted(inputContext.next, inputContext.next)
      }

      const res = findAllMatchedToken(inputContext.converted, inputContext.raw);

      // FIXME: everything
      chrome.input.ime.setCandidates({
        contextID,
        candidates: res.map((r, i) => ({ candidate: r, id: i })),
      });
      chrome.input.ime.setCandidateWindowProperties({
        engineID: 'test-ime-us',
        properties: {
          visible: true,
        }
      });
    }
    this.#_conversion = v;
  }
  get conversion() {
    return this.#_conversion;
  }
}

const imeState = new ImeState;

chrome.input.ime.onActivate.addListener((_engineID, _screen) => {
  chrome.input.ime.setMenuItems({
    engineID: 'test-ime-us',
    items: imeState.menuItems,
  });
});

// FIXME:
chrome.input.ime.onMenuItemActivated.addListener((_engineID, name) => {
  imeState.mode = /** @type { ModeVal } */ (name);
});


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

// TODO: use
let conversionContext = {};

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

      // FIXME: in US keymap, ime cannot capture Henkan/Muhenkan keyevents.
      else if(keyData.key === 'Convert') {
        imeState.mode = MODE.PRE_CONVERSION;
        return true;
      }

      else if(keyData.key === 'NonConvert') {
        imeState.mode = MODE.DIRECT;
        return true;
      }

      else if(imeState.mode === MODE.DIRECT) {
        return false;
      }

      else if(imeState.conversion) {
        if(keyData.key === 'Enter') {
          imeState.conversion = false;
        }

        return true;
      }

      else if(keyData.key === 'Enter') {
        if(checkNotInputting()) {
          return false;
        }

        commitText();
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

      else if(keyData.key === ' ') {
        imeState.conversion = true;
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
