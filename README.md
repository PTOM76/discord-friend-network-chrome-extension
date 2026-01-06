# Discord Friend Network (日本語)
Discord の共通フレンドのメッシュを作成する Chrome拡張機能<br>
Geminiも開発の中で活用してみました。いわゆるバイブコーディングとかいうやつでしょうか。

## ガイド
### 共通フレンドのメッシュを構築する方法
拡張機能を導入後、Discordを開いてください。<br>

1. フレンドのプロフィールを開き、「◯人の共通の友だち」のタブを開いてください (推奨)
2. サーバーのメンバーリストからフレンドのプロフィールを開いてください (※フレンド以外のプロフィールを開くと友だちとして認識されてしまうため、注意が必要です)

この1, 2 のどちらかで共通フレンドとしてDiscord Friend Networkに登録されます。<br>

### 共通フレンドのメッシュを表示する方法
Chrome拡張機能のDiscord Friend Networkのアイコンをクリックしてください。<br>
フレンドの数によっては表示に時間がかかる場合があります。<br>
<br>
上のバーにある「更新」をクリックすることで再構築できます。(リロードせずに済むだけ)<br>

メッシュにあるノードを右クリックすることで「非表示」、「削除」できます。

### 設定
「共通フレンドのメッシュを表示する方法」で開いてるページの上のバーにある「設定」から開きます。

- 自分のノードを表示する - 自分のノードをメッシュに表示するかどうかを設定します。
- 自動検出(フック)を有効にする - Discordのフックを有効にするかどうかです。(新たに共通フレンドを登録したくない場合はオフにします)
- Language - 言語設定を変更します。(現在は日本語と英語のみ対応)
- 非表示リスト - 非表示したユーザーを再度表示する場合はここから行います。
- インポート - JSON形式でエクスポートしたデータをインポートします。
- エクスポート - 現在のデータをJSON形式でエクスポートします。
- リセット - すべてのデータをリセットします。

## 開発ツール
- VSCode
- Node.js (TypeScript)
- Chrome
- Gemini 2 Pro/Flash (AIエージェント/コード補完)

## 参考記事
- 一瞬で終わるTypeScriptでChrome拡張機能開発ハンズオン https://qiita.com/msdsm/items/4661217ffbee2eee0663

# Discord Friend Network (English)
A Chrome extension that creates a mesh of mutual friends on Discord.<br>
I also utilized Gemini during development. This is what is commonly referred to as vibe coding.

## Guide
### How to build a mesh of mutual friends
After installing the extension, open Discord.<br>
1. Open a friend's profile and go to the "Mutual Friends" tab (recommended).
2. Open a friend's profile from the server member list (Note: Be careful as opening a non-friend's profile will register them as a friend).<br>
Either of these methods will register the mutual friend in Discord Friend Network.<br>

### How to display the mesh of mutual friends
Click the Discord Friend Network icon in the Chrome extension.<br>
Depending on the number of friends, it may take some time to display.<br>
<br>
You can click "Refresh" on the top bar to rebuild it (without reloading).<br>
You can right-click on a node in the mesh to "Hide" or "Delete" it.<br>
### Settings
You can open it from the "Settings" on the top bar of the page opened in "How to display the mesh of mutual friends".
- Show my node - Set whether to display your own node in the mesh.
- Enable auto-detection (hook) - Set whether to enable Discord hooks (turn off if you don't want to register new mutual friends).
- Language - Change the language settings (currently only supports Japanese and English).
- Hidden list - You can re-display users that you have hidden from here.
- Import - Import data exported in JSON format.
- Export - Export the current data in JSON format.
- Reset - Reset all data.

## Development Tools
- VSCode
- Node.js (TypeScript)
- Chrome
- Gemini 2 Pro/Flash (AI Agent/Code Completion)

## References
- 一瞬で終わるTypeScriptでChrome拡張機能開発ハンズオン (JP) https://qiita.com/msdsm/items/4661217ffbee2eee0663
