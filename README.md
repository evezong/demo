# Coin Market — Angular RWD 小專案

用 Angular 做的加密貨幣行情頁，串接 Binance 公開 REST API（不需要 API Key），支援手機、平板、桌機。

## 啟動方式

```bash
npm install
npm start        # 打開 http://localhost:4200
```

## 功能

- **行情列表**（`/`）：顯示 8 個幣種的價格、24h 漲跌幅與成交額，可以搜尋、重新整理
- **幣種詳情**（`/coin/:symbol`）：點卡片進入，顯示 24h 最高、最低、漲跌幅、成交額
- 有載入中、錯誤、搜尋不到三種狀態的提示

## 用到的技術

### Angular
- Standalone Component
- Router：兩個頁面，詳情頁從網址參數 `:symbol` 取得幣種
- Service + HttpClient：API 請求都寫在 `CoinService`，元件只負責顯示
- Signal：管理 `loading`、`error`、列表資料；`computed` 做搜尋過濾
- 內建 `DecimalPipe` 格式化數字，`@if` / `@for` 控制流程

### API
- `GET https://data-api.binance.vision/api/v3/ticker/24hr`
- API 回傳的數字是字串，在 Service 裡用 `map` 轉成 `number`，並定義 `TickerResponse`（API 原始格式）和 `Coin`（畫面使用）兩個 interface

### RWD（SCSS）
- **Mobile First**：先寫手機樣式，再用 `@media (min-width)` 往上調整
- 卡片列表用 CSS Grid：手機 1 欄 → 平板（768px）2 欄 → 桌機（1024px）4 欄
- 搜尋列：手機上下排列，平板以上左右排列
- 共用顏色放在 `src/variables.scss`，用 `@use` 引入

## 專案結構

```
src/
├── variables.scss            # SCSS 共用變數
├── styles.scss               # 全域樣式
└── app/
    ├── models/coin.ts        # 資料型別
    ├── services/coin.service.ts   # 呼叫 API
    └── pages/
        ├── coin-list/        # 列表頁
        └── coin-detail/      # 詳情頁
```
