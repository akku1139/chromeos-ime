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
  * @type { Map<number, ContextManager> }
  */
  contexts;

  /**
   * @param { string } engineID
   * @param { chrome.input.ime.ScreenType } screen
   */
  constructor(engineID, screen) {
    this.engineID = engineID;
    this.screen = screen;

    this.contexts = new Map();
  }

  /**
   * deconstructor
   */
  cleanup() {
    // commit current context
  }
}

class ContextManager {
  /**
   * @readonly
   * @type { chrome.input.ime.InputContext }
   */
  systemContext;

  /**
   * @param { chrome.input.ime.InputContext } systemContext
   */
  constructor(systemContext) {
    this.systemContext = systemContext;
  }
}

/**
 * It must be assigned whenever it is used.
 * @type { IME }
 */
let ime;

/**
 * @type { Parameters<typeof chrome.input.ime.onFocus.addListener>[0] }
 */
export const onFocusListener = (context) => {
  if(ime.contexts.has(context.contextID)) {
    throw new Error(`Creating duplicate contexts: ${context.contextID}`);
  }
  ime.contexts.set(context.contextID, new ContextManager(context));
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
};
