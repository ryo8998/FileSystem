# FileSystem
Recursion Project6 File System

## アプリ概要
ブラウザー上で遊べるバーチャルなファイルシステムです。以下コマンドに対応しています。

　◆対応コマンド
　　ls(-a,-rオプション), touch ,mkdir ,rm, print ,pwd, move, copy

# URL 
https://ryo8998.github.io/FileSystem/

# 実装　
- デザインパターンを意識し（コンポジット/シングルトン/ストラテジー/テンプレート）
- 可能な限り抽象クラス使用(JSなので厳密ではない)を使って流れを設計し、実装はサブクラスで実施
- switch文を使用せずにコマンド切り替えを実施

