import { ime, INPUT_MODE } from '../contextManager.js';
import { defaultRomajiTable, defaultRomajiTableKeys } from '../../romajiTable.js';

/**
 * @param { string | Array<string> } raw
 * @param { string } converted
 */
const addConverted = (raw, converted) => {
  ime.activeContext.kana.converted += converted;
  if(Array.isArray(raw)) {
    ime.activeContext.kana.raw.push(...raw);
  } else {
    ime.activeContext.kana.raw.push(raw);
  }
}

const getMatchingKeysCount = () => defaultRomajiTableKeys.filter(v => v.startsWith(ime.activeContext.kana.work.next)).length;

const checkNotInputting = () => ime.activeContext.kana.converted === '' && ime.activeContext.kana.work.next === '';

const setComposition = () => chrome.input.ime.setComposition({
  contextID: ime.activeContext.systemContext.contextID,
  text: ime.activeContext.kana.converted + ime.activeContext.kana.work.next,
  cursor: ime.activeContext.kana.converted.length + ime.activeContext.kana.work.next.length
});

// TODO: share it
const commitInputContext = () => {
  if(ime.activeContext.kana.work.next !== '') {
    // NOTE: Mozc doesn't convert at this time. ex: 'n' -> 'ん'
    // const conv = defaultRomajiTable[inputContext.next];
    // addConverted(inputContext.next, conv ? conv[0] : inputContext.next)
    addConverted(ime.activeContext.kana.work.next, ime.activeContext.kana.work.next)
  }

  const converted = ime.activeContext.kana.converted;
  const raw = ime.activeContext.kana.raw;

  chrome.input.ime.commitText({
    contextID: ime.activeContext.systemContext.contextID,
    text: ime.activeContext.kana.converted,
  });
  ime.activeContext.clear();

  return [converted, raw];
};

/**
 * @type { InputMode }
 */
export const preConversion = {
  keydown(keyData) {
    if(keyData.key === 'Enter') {
      if(checkNotInputting()) {
        return false;
      }

      commitInputContext();

      return true;
    }

    // FIXME: support surrogate pair
    else if(keyData.key === 'Backspace') {
      if(checkNotInputting()) {
        return false;
      }

      if(ime.activeContext.kana.work.next !== '') {
        ime.activeContext.kana.work.next = ime.activeContext.kana.work.next.slice(0, -1);
        setComposition();
        return true; // FIXME: bug?
      }

      if(ime.activeContext.kana.converted !== '') {
        ime.activeContext.kana.converted = ime.activeContext.kana.converted.slice(0, -1);
        ime.activeContext.kana.raw.pop();
        setComposition();
        return true;
      }

      return true;
    }

    // FIXME: impl
    else if(keyData.key === 'Delete') {
      if(checkNotInputting()) {
        return false;
      }

      return true;
    }

    else if(keyData.key === ' ') {
      ime.activeInputMode = INPUT_MODE.CONVERSION;
      return true;
    }

    else if(keyData.key.match(/^[A-Z]$/)) {
      const input = ime.activeContext.kana.work.next + keyData.key;
      addConverted(Array.from(input), input);
      ime.activeContext.kana.work.next = '';
      setComposition();
      return true;
    }

    else if(keyData.key.match(/^[a-z]$/)) {
      ime.activeContext.kana.work.next += keyData.key;
      const conv = defaultRomajiTable[ime.activeContext.kana.work.next];
      if(conv === void 0) {
        if(getMatchingKeysCount() === 0) {
          if(ime.activeContext.kana.work.keep.kana !== '') {
            addConverted(ime.activeContext.kana.work.keep.raw, ime.activeContext.kana.work.keep.kana);
            ime.activeContext.kana.work.keep = {
              raw: '',
              kana: '',
            };
            ime.activeContext.kana.work.next = keyData.key;
          }
        }
        if(getMatchingKeysCount() === 0) { // different ime.activeContext.kana.work.next
          addConverted(Array.from(ime.activeContext.kana.work.next), ime.activeContext.kana.work.next);
          ime.activeContext.kana.work.next = '';
        }
      } else {
        if(getMatchingKeysCount() === 1) {
          addConverted(ime.activeContext.kana.work.next, conv[0]);
          ime.activeContext.kana.work.next = conv[1] ?? '';
          ime.activeContext.kana.work.keep = {
            raw: '',
            kana: '',
          };
        } else {
          ime.activeContext.kana.work.keep = {
            raw: ime.activeContext.kana.work.next,
            kana: conv[0],
          };
        }
      }
      setComposition();
      return true;
    } else {
      return false;
    }
  }
};
