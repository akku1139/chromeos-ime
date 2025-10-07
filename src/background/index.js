import { defaultRomajiTable } from '../romajiTable';

let contextID = -1;
let inputContext = {
  converted: '',
  next: '',
};

chrome.input.ime.onFocus.addListener((context) => {
  contextID = context.contextID;
});

chrome.input.ime.onKeyEvent.addListener(
  (engineID, keyData) => {
    chrome.input.ime.commitText({
      contextID,
      text: `debug: { engineID: ${engineID}, keyData: { type: ${keyData.type}, key: ${keyData.key} } }`,
    });
    return true;

    if(keyData.type === 'keydown') {
      if(keyData.key === 'Enter') {
        chrome.input.ime.commitText({
          contextID,
          text: inputContext.converted,
        });
        inputContext.converted = '';
        inputContext.next = '';
      } else if(keyData.key.match(/^[a-z]$/)) {
        const key = inputContext.next + keyData.key;
        const conv = defaultRomajiTable[key];
        if(conv === void 0) {
          inputContext.next += key;
        } else {
          inputContext.converted += conv;
          inputContext.next = '';
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
