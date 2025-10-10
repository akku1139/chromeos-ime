import { onActivateListener, onBlurListener, onFocusListener, onResetListener } from './contextManager.js';
import { onKeyEventListener } from './input.js';

chrome.input.ime.onFocus.addListener(onFocusListener);

chrome.input.ime.onBlur.addListener(onBlurListener);

chrome.input.ime.onActivate.addListener(onActivateListener);

chrome.input.ime.onReset.addListener(onResetListener);

chrome.input.ime.onKeyEvent.addListener(onKeyEventListener);
