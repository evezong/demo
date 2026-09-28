# RW Market — Angular 即時行情看板

用 Angular 21 做的加密貨幣即時行情 Demo。先用 **REST API** 載入初始資料，再切到 **WebSocket** 接收即時推播，版面支援 **RWD**（手機、平板、桌機）。

資料來源是 [Binance 公開行情 API](https://developers.binance.com/docs/binance-spot-api-docs)，不需要 API Key。

## 快速開始

```bash
npm install
npm start          # http://localhost:4200
npm test           # Vitest 單元測試
npm run build      # 正式版建置，輸出到 dist/
```

## 功能

| 頁面 | 功能 |
| --- | --- |
| 市場行情 `/` | 12 個 USDT 交易對即時報價、依欄位排序、搜尋、自選 ★（存在 localStorage）、價格跳動上色 |
| 交易對詳情 `/market/:symbol` | SVG K 線圖（15m / 1h / 4h / 1d，可 hover 看 OHLC）、即時成交明細、買賣力道條、分頁標題顯示即時價格 |
| 全域 | WebSocket 連線狀態燈號、骨架屏 loading、錯誤狀態與重試 |

## 技術重點

### Angular
- **Standalone component + Signals + Zoneless**：狀態都放在 `signal` / `computed`，搭配 `OnPush`
- **新版控制流程**：`@if` / `@for` / `@empty`
- **Lazy loading 路由**：兩個頁面各自拆成獨立的 chunk
- **`withComponentInputBinding()`**：路由參數 `:symbol` 直接綁到元件的 `input()`
- **Functional interceptor**：網路錯誤或 5xx 時自動重試，最後統一轉成 `ApiError`，顯示中文錯誤訊息
- **InjectionToken** 注入 API 位址，測試時可以直接替換

### RxJS / 即時資料
- `forkJoin` 平行打三支 REST API，完成後 `switchMap` 切到 WebSocket
- 切換交易對或 K 線週期時，`switchMap` 會**自動取消**前一次的請求和連線
- `webSocket` + `retry` / `repeat` **指數退避重連**（1s → 2s → 4s … 最多 30s）
- 同一交易對的成交和 K 線共用**一條 combined stream**，用 `share()` 共用後再依 stream 名稱分流
- 高頻成交資料用 `bufferTime(300ms)` 批次更新，減少重繪次數
- `takeUntilDestroyed` 在元件銷毀時自動取消訂閱

### RWD（SCSS）
- Mobile first，斷點 mixin 寫在 `src/styles/_breakpoints.scss`（`bp.up(md)` / `bp.down(sm)`）
- 行情列表用 **CSS Grid `grid-template-areas`**：同一份 HTML，手機是兩行卡片，桌機是表格
- 手機上表頭會變成可以橫向滑動的排序 chips
- 詳情頁在手機上下堆疊、桌機左右兩欄；K 線圖用 `viewBox` 自動縮放，觸控也能看 OHLC
- 字級、圖表高度用 `clamp()` 流體縮放；支援 `prefers-reduced-motion`
- 用 CSS custom properties 管理主題色

### 測試（Vitest，26 個測試）
- `HttpTestingController` 測 API 的資料轉換與錯誤處理
- K 線座標計算、K 線合併、pipes 這些純函式的單元測試
- 元件測試：mock service 後驗證排序、搜尋、自選、即時更新、錯誤狀態

## 專案結構

```
src/app/
├── core/
│   ├── api/            # BinanceApiService (REST)、MarketStreamService (WebSocket)、mappers
│   ├── http/           # HTTP 錯誤攔截器
│   ├── models/         # TypeScript 型別
│   ├── watchlist/      # 自選清單 (signal + localStorage)
│   └── market.config.ts
├── features/
│   ├── market-list/    # 行情列表頁
│   └── symbol-detail/  # 交易對詳情頁
└── shared/
    ├── candle-chart/   # 純 SVG K 線圖 + 座標計算
    └── pipes/          # price / compactNumber / signedPercent
```

## 可以再延伸的方向
- 用 NgRx SignalStore 管理全域狀態
- 加上 Order Book（`@depth` stream）並做虛擬捲動
- 用 Playwright 補 E2E 測試，搭配 GitHub Actions CI
- 打包成 Docker image（nginx 提供靜態檔）
