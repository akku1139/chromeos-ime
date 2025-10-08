import { dictTree } from '../dict/index.js';

// FIXME: logic error

/**
 *
 * @param { string } kana
 * @param { Array<string> } raw
 * @returns { Array<string> }
 */
export const findAllMatchedToken = (kana, raw) => {
  let i = 0;
  let target = '';

  /**
   * @type { Array<string> }
   */
  const res = [];

  let currentNode = dictTree;

  const s = Array.from(kana);

  for(const k of s) {
    target += k;
    const data = currentNode.get(k);

    if(!data) {
      break;
    }

    if(data.end) {
      res.push(target);
    }

    if(raw[i+1] !== undefined) {
      const rs = Array.from(raw[i+1]);
      let rawTarget = target;
      let rawNode = data;

      for(const r of rs) {
        const rawData = rawNode.children.get(r);

        if(!rawData) {
          break;
        }

        rawTarget += r;

        if(rawData.end) {
          res.push(rawTarget);
        }

        rawNode = rawData;
      }
    }


    currentNode = data.children;

    i++;
  }

  return res;
}
