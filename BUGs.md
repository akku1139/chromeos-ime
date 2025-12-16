## preconvで ryk みたいなのがあるときにBackspaceして a を入れても りゃ が出ない

変換中文字列をそのまま持ってローマ字を逆走しながら後方最長一致で選択
ローマ字テーブルをループするのは遅いので、最長候補の長さを保持して、それまでを直接取れば良い

## 時々辞書のロードに失敗する

```
Failed to load the script unexpectedly
Context
external/skk-dict/json/SKK-JISYO.S.json
Stack Trace
external/skk-dict/json/SKK-JISYO.S.json:0 (anonymous function)
```

流石に意味がわからん
importやめる?

js+export defaultにした
辞書更新のたびに書き換え必要

## 確定した分がinputContextから消えない
