// SPDX-License-Identifier: AGPL-3.0-or-later

import { conversion } from './input/conversion.js';
import { directInput } from './input/direct.js';
import { preConversion } from './input/preConversion.js';

class ContextManager {
  /**
   * @readonly
   * @type { chrome.input.ime.InputContext }
   */
  systemContext;

  /**
   * @type { {
   *    converted: string,
   *    raw: Array<string>,
   *    work: {
   *      keep: {
   *        raw: string,
   *        kana: string,
   *      },
   *      next: string,
   *    }
   * } }
   */
  kana;

  /**
   * @param { chrome.input.ime.InputContext } systemContext
   */
  constructor(systemContext) {
    this.systemContext = systemContext;

    // this.clear();
    this.kana = { converted: '', raw: [], work: { keep: { raw: '', kana: '' }, next: '' } };
  }

  clear() {
    this.kana = { converted: '', raw: [], work: { keep: { raw: '', kana: '' }, next: '' } };
  }
}

export const INPUT_MODE = /** @type {const} */ ({
  DIRECT: directInput,
  PRE_CONVERSION: preConversion, // TODO: add non-Hiragana modes
  CONVERSION: conversion,
});

class IME {
  /**
   * @readonly
   * @type { string }
   */
  engineID;

  /**
   * @readonly
   * @type { chrome.input.ime.ScreenType }
   */
  screen;

  /**
   * @readonly
   * @type { Map<number, ContextManager> }
   */
  contexts;

  /**
   * @type { ContextManager }
   */
  activeContext;

  /**
   * @type { InputMode }
   */
  activeInputMode;

  /**
   * @param { string } engineID
   * @param { chrome.input.ime.ScreenType } screen
   */
  constructor(engineID, screen) {
    this.engineID = engineID;
    this.screen = screen;

    this.contexts = new Map();

    // FIXME: dummy context
    this.activeContext = new ContextManager({
      contextID: -1,
      type: 'text',
      autoCorrect: false,
      autoComplete: false,
      autoCapitalize: 'characters',
      spellCheck: false,
      shouldDoLearning: false,
    });

    this.activeInputMode = INPUT_MODE.DIRECT;
  }

  /**
   * deconstructor
   */
  cleanup() {
    // commit current context
  }
}

/**
 * It must be assigned whenever it is used.
 * @type { IME }
 */
export let ime;

/**
 * @type { Parameters<typeof chrome.input.ime.onFocus.addListener>[0] }
 */
export const onFocusListener = (context) => {
  let activeContext = ime.contexts.get(context.contextID);
  if(!activeContext) {
    const c = new ContextManager(context);
    ime.contexts.set(context.contextID, c);
    activeContext = c;
  }
  ime.activeContext = activeContext;
};

/**
 * @type { Parameters<typeof chrome.input.ime.onBlur.addListener>[0] }
 */
export const onBlurListener = (contextID) => {
  // TODO: commitContext
  const ret = ime.contexts.delete(contextID);
  if(!ret) {
    throw new Error(`Removing a non-existent context: ${contextID}`);
  }
};

/**
 * @type { Parameters<typeof chrome.input.ime.onActivate.addListener>[0] }
 */
export const onActivateListener = (engineID, screen) => {
  ime = new IME(engineID, screen);
};

/**
 * @type { Parameters<typeof chrome.input.ime.onReset.addListener>[0] }
 */
export const onResetListener = (engineID) => {
  // ime = void 0;
  // FIXME: reset job
  ime = new IME('', 'normal');
};
