import { ime } from './contextManager.js';

/**
 * @type { Parameters<typeof chrome.input.ime.onKeyEvent.addListener>[0] }
 */
export const onKeyEventListener = (engineID, keyData, _requestId) => {
  if(engineID !== ime.engineID) {
    throw new Error(`Key Event for non-active engine`);
  }

  return ime.activeInputMode[keyData.type]?.(keyData, ime.activeContext) ?? false;
};
