// SPDX-License-Identifier: AGPL-3.0-or-later

import { findAllMatchedToken } from '../../converter/index.js';
import { ime } from '../contextManager.js';

/**
 * @type { InputMode }
 */
export const conversion = {
  init() {
    const res = findAllMatchedToken(ime.activeContext.kana.converted, ime.activeContext.kana.raw);

    // FIXME: everything
    chrome.input.ime.setCandidates({
      contextID: ime.activeContext.systemContext.contextID,
      candidates: [...res.map((r, i) => ({ candidate: r, id: i }))],
    });
    chrome.input.ime.setCandidateWindowProperties({
      engineID: ime.engineID,
      properties: {
        visible: true,
        vertical: true,
      }
    });
  },

  cleanup() {
    chrome.input.ime.setCandidateWindowProperties({
      engineID: ime.engineID,
      properties: {
        visible: false,
      }
    });
  },
};
