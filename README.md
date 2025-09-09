# purplehoge Portfolio

purplehogeの個人ポートフォリオサイトです。HTML、CSS、JavaScriptを使用したレスポンシブ対応のWebサイトです。

## 概要

シンプルで美しく、機能的なポートフォリオサイトを目指して開発しました。モダンなWebデザインとアクセシビリティを重視した実装になっています。

### 主な特徴

- 📱 **レスポンシブデザイン**: PC、タブレット、スマートフォンすべてに対応
- ♿ **アクセシビリティ**: WCAG 2.1 AAレベルに配慮
- ⚡ **高パフォーマンス**: 軽量で高速な読み込み
- 🎨 **モダンデザイン**: 洗練されたUIとスムーズなアニメーション

## 技術スタック

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **ホスティング**: GitHub Pages
- **バージョン管理**: Git/GitHub

## ファイル構成

```
portfolio/
├── index.html              # メインページ
├── css/
│   ├── styles.css          # メインスタイル
│   └── responsive.css      # レスポンシブ対応
├── js/
│   ├── main.js            # メインロジック
│   └── utils.js           # ユーティリティ関数
├── images/
│   ├── projects/          # プロジェクト画像
│   └── icons/             # アイコン類
├── docs/                   # 設計ドキュメント
│   ├── 01_要件定義.md
│   ├── 02_基本設計.md
│   └── 03_詳細設計.md
├── README.md              # このファイル
└── .gitignore             # Git除外設定
```

## セクション構成

### 1. Hero Section
- 印象的なファーストビュー
- ニックネームとキャッチフレーズ
- アクションボタン

### 2. About Section
- 簡潔な自己紹介
- 開発者としての姿勢や方針

### 3. Skills Section
- 技術スキルの可視化
- カテゴリ別のスキル分類
- スキルレベルの表示

### 4. Projects Section
- 制作実績の紹介
- 使用技術の表示
- デモとソースコードへのリンク

## 開発のポイント

### CSS設計
- **BEM記法**による一貫した命名規則
- **CSS変数**によるテーマ管理
- **モバイルファースト**のレスポンシブ設計

### JavaScript
- **ES6+**を使用したモダンな記法
- **クラスベース**の設計
- **エラーハンドリング**の充実

### パフォーマンス
- 軽量な画像ファイル
- 効率的なCSSとJavaScript
- レイジーローディング対応

### アクセシビリティ
- セマンティックなHTML
- キーボード操作対応
- 適切な色彩コントラスト

## ローカル開発

1. リポジトリをクローン
```bash
git clone https://github.com/purplehoge/purplehoge-portfolio.git
cd purplehoge-portfolio
```

2. ローカルサーバーで確認
```bash
# Python3の場合
python -m http.server 8000

# Node.jsがある場合
npx serve .
```

3. ブラウザで確認
```
http://localhost:8000
```

## デプロイ

GitHub Pagesを使用して自動デプロイされます。

- **本番URL**: https://purplehoge.github.io/purplehoge-portfolio/
- **デプロイブランチ**: `main`
- **更新方法**: mainブランチへのpushで自動更新

## ブラウザサポート

- Chrome (最新版 + 1つ前のバージョン)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## ライセンス

このプロジェクトは個人ポートフォリオとして作成されています。

---

## 開発者

**purplehoge**

Web開発者として日々学習と実践を続けています。ユーザビリティとパフォーマンスを重視したWeb開発を心がけています。

---

## 更新履歴

### v1.0.0 (2024-09-09)
- 初回リリース
- 基本的なポートフォリオ機能を実装
- レスポンシブデザイン対応
- アクセシビリティ対応