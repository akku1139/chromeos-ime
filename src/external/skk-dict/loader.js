// SPDX-License-Identifier: AGPL-3.0-or-later

import src_jisho_s from './json/SKK-JISYO.S.json' with { type: 'json' };

/**
 * @type { Dict }
 */
export const skk_jisho_s = new Map([
  ...Object.entries(src_jisho_s.okuri_ari).map(v => /** @type {const} */ ([
    v[0],
    { target: v[1] }
  ])),
  ...Object.entries(src_jisho_s.okuri_nasi).map(v => /** @type {const} */ ([
    v[0],
    { target: v[1] }
  ])),
]);
