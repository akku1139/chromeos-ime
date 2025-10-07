// https://developer.chrome.com/docs/extensions/reference/api/input/ime?hl=ja#examples

let context_id = -1;

chrome.input.ime.onFocus.addListener(function(context) {
  context_id = context.contextID;
});

chrome.input.ime.onKeyEvent.addListener(
  function(engineID, keyData) {
    if (keyData.type == "keydown" && keyData.key.match(/^[a-z]$/)) {
      chrome.input.ime.commitText({"contextID": context_id,
                                    "text": keyData.key.toUpperCase()});
      return true;
    } else {
      return false;
    }
  }
);
