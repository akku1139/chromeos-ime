import { dictTree } from '../dict';

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


    const rs = Array.from(raw[i+1]);
    let rawTarget = target;
    let rawNode = currentNode;

    for(const r of rs) {
      rawTarget += r;
      const data = rawNode.get(r);

      if(!data) {
        break;
      }

      if(data.end) {
        res.push(rawTarget);
      }

      rawNode = data.children;
    }


    currentNode = data.children;

    i++;
  }

  return res;
}
