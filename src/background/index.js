import { defaultRomajiTable, defaultRomajiTableKeys } from '../romajiTable.js';

let contextID = -1;
let inputContext = {
  converted: '',
  next: '',
  keep: '',
};

const combKeys = {
  Control: false,
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


chrome.input.ime.onFocus.addListener((context) => {
  contextID = context.contextID;
});

chrome.input.ime.onKeyEvent.addListener(
  (engineID, keyData) => {
      // chrome.input.ime.commitText({
      //   contextID,
      //   text: `debug: { engineID: ${engineID}, keyData: { type: ${keyData.type}, key: ${keyData.key} } }`,
      // });

    if((keyData.type === 'keydown' || keyData.type === 'keyup') && combKeysList.includes(keyData.key)) {
      combKeys[keyData.key] = keyData.type === 'keydown' ? true : false;
    }

    if(keyData.type === 'keydown') {
      if(combKeys.Control) {
        return false;
      }

      if(keyData.key === 'Enter') {
        if(checkNotInputting()) {
          return false;
        }

        if(inputContext !== '') {
          const conv = defaultRomajiTable[inputContext.next];
          inputContext.converted += conv[0] ?? inputContext.next;
        }

        chrome.input.ime.commitText({
          contextID,
          text: inputContext.converted,
        });
        inputContext.converted = '';
        inputContext.next = '';
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
        inputContext.converted += inputContext.next + keyData.key;
        inputContext.next = '';
        setComposition();
        return true;
      }

      else if(keyData.key.match(/^[a-z]$/)) {
        inputContext.next += keyData.key;
        const conv = defaultRomajiTable[inputContext.next];
        if(conv === void 0) {
          if(inputContext.keep !== '') {
            if(defaultRomajiTableKeys.filter(v => v.startsWith(inputContext.next)).length === 0) {
              inputContext.converted += inputContext.keep;
              inputContext.keep = '';
            }
          }
        } else {
          if(defaultRomajiTableKeys.filter(v => v.startsWith(inputContext.next)).length === 1) {
            inputContext.converted += conv[0];
            inputContext.next = conv[1] ?? '';
            inputContext.keep = '';
          } else {
            inputContext.keep = conv[0];
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
