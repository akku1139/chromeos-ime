import { defaultRomajiTable } from '../romajiTable.js';

let contextID = -1;
let inputContext = {
  converted: '',
  next: '',
};

const checkNotInputting = () => inputContext.converted === '' && inputContext.next === ''

chrome.input.ime.onFocus.addListener((context) => {
  contextID = context.contextID;
});

chrome.input.ime.onKeyEvent.addListener(
  (engineID, keyData) => {
      // chrome.input.ime.commitText({
      //   contextID,
      //   text: `debug: { engineID: ${engineID}, keyData: { type: ${keyData.type}, key: ${keyData.key} } }`,
      // });

    if(keyData.type === 'keydown') {
      if(keyData.key === 'Enter') {
        if(checkNotInputting()) {
          return false;
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
          return true;
        }

        if(inputContext.converted !== '') {
          inputContext.converted = inputContext.converted.slice(0, -1);
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

      else if(keyData.key.match(/^[a-z]$/)) {
        const key = inputContext.next + keyData.key;
        const conv = defaultRomajiTable[key];
        if(conv === void 0) {
          inputContext.next += key;
        } else {
          inputContext.converted += conv[0];
          inputContext.next = conv[1] ?? '';
        }
        chrome.input.ime.setComposition({
          contextID,
          text: inputContext.converted + inputContext.next,
          cursor: inputContext.converted.length + inputContext.next.length
        });
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
);
