# AVG Engine 實作計劃

## 技術棧
- **前端**: React + TypeScript + Vite
- **後端**: Firebase (Hosting + Firestore + Storage)
- **資料來源**: Google Sheets API → Firestore 快取
- **圖片存放**: Firebase Storage

---

## 階段一：專案初始化 & 基礎架構

### 1.1 建立 React + TypeScript + Vite 專案
- `npm create vite@latest` with React + TypeScript template
- 安裝依賴: firebase, react-router-dom

### 1.2 Firebase 設定
- 初始化 Firebase 專案 (Firestore + Hosting + Storage)
- 建立 `src/firebase.ts` 設定檔

### 1.3 專案結構
```
src/
├── components/       # React UI 元件
│   ├── DialogueBox.tsx      # 對話框（角色名、文字、點擊推進）
│   ├── ChoicePanel.tsx      # 選項按鈕列表
│   ├── CharacterSprite.tsx  # 角色立繪顯示
│   ├── BackgroundLayer.tsx  # 背景圖層
│   └── SaveLoadMenu.tsx     # 存讀檔介面
├── engine/           # 遊戲引擎核心邏輯
│   ├── GameEngine.ts        # 主引擎：管理遊戲狀態推進
│   ├── ScriptParser.ts      # 解析 Sheet 資料為遊戲指令
│   ├── VariableSystem.ts    # 好感度/變數管理 + condition 判斷
│   └── SaveSystem.ts        # 存檔/讀檔 (Firestore)
├── data/             # 資料層
│   ├── SheetLoader.ts       # Google Sheets API 讀取
│   └── types.ts             # TypeScript 型別定義
├── App.tsx
└── main.tsx
```

---

## 階段二：Google Sheet 資料讀取

### 2.1 Google Sheets API 設定
- 建立 Google Cloud 專案，啟用 Sheets API
- 取得 API Key（Sheet 設為公開讀取即可）
- 實作 `SheetLoader.ts`：讀取 5 個 Sheet 並轉為 JSON

### 2.2 型別定義 (`types.ts`)
```typescript
interface Scene {
  scene_id: string;
  scene_name: string;
  bg_image: string;
  bgm: string;
}

interface Dialogue {
  id: number;
  scene_id: string;
  character: string;   // 角色 ID 或 "→CHOICE:xxx"
  text: string;
  expression: string;
}

interface Choice {
  choice_id: string;
  option_text: string;
  condition: string;   // e.g. "girl_affection>=3"
  effect: string;      // e.g. "girl_affection+1"
  next_scene: string;
}

interface Character {
  character_id: string;
  display_name: string;
  default_image: string;
  color: string;
}

interface Variable {
  var_name: string;
  default_value: string;
  description: string;
}
```

### 2.3 資料快取
- 首次載入從 Google Sheets 拉資料
- 存入 Firestore 作為快取
- 之後優先讀 Firestore，提供手動 refresh 按鈕

---

## 階段三：遊戲引擎核心

### 3.1 GameEngine
- 管理當前 scene_id、dialogue index
- 點擊推進對話（下一行）
- 遇到 `→CHOICE:xxx` 時觸發選項面板
- 選擇後：執行 effect → 跳轉 next_scene

### 3.2 VariableSystem
- 儲存所有遊戲變數 (Map<string, number | boolean>)
- 解析 condition 字串: `girl_affection>=3` → 判斷 true/false
- 解析 effect 字串: `girl_affection+1` → 修改變數值
- 用簡單正則就能處理，不需要複雜的表達式引擎

### 3.3 ScriptParser
- 將 Sheet 原始資料轉為引擎可用的結構
- 按 scene_id 將 dialogues 分組
- 處理 `→CHOICE:` 標記

---

## 階段四：前端 UI

### 4.1 遊戲畫面 Layout
```
┌─────────────────────────────┐
│         背景圖               │
│                             │
│    [角色立繪]                │
│                             │
│  ┌─────────────────────┐    │
│  │ 角色名               │    │
│  │ 對話文字...           │    │
│  │ （點擊繼續）          │    │
│  └─────────────────────┘    │
│                             │
│  [選項A] [選項B] [選項C]    │  ← 出現選項時顯示
└─────────────────────────────┘
```

### 4.2 元件實作
- **BackgroundLayer**: 全螢幕背景，支援切換淡入淡出
- **CharacterSprite**: 角色立繪，根據 expression 切換
- **DialogueBox**: 打字機效果逐字顯示，點擊可跳過
- **ChoicePanel**: 選項按鈕，根據 condition 過濾可選項
- **SaveLoadMenu**: 存檔位列表，顯示截圖/進度

---

## 階段五：存檔系統

### 5.1 SaveSystem
- 存檔資料結構：
  ```json
  {
    "save_id": "slot_1",
    "scene_id": "meet_girl",
    "dialogue_index": 3,
    "variables": { "girl_affection": 2, "courage": 1 },
    "timestamp": "2026-02-16T12:00:00Z"
  }
  ```
- 匿名登入 (Firebase Auth anonymous) → Firestore 存檔
- 3~5 個存檔位

---

## 實作順序

1. **專案初始化** — Vite + React + Firebase 設定
2. **型別定義 + 假資料** — 先用 JSON mock data 測試
3. **遊戲引擎核心** — GameEngine + VariableSystem
4. **前端 UI 元件** — 對話框 + 選項 + 背景
5. **Google Sheet 串接** — SheetLoader + Firestore 快取
6. **存檔系統** — Firebase Auth + Firestore 存檔
7. **部署** — Firebase Hosting
