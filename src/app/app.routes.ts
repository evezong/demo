import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: '市場行情 | RW Market',
    loadComponent: () => import('./features/market-list/market-list').then((m) => m.MarketList),
  },
  {
    path: 'market/:symbol',
    loadComponent: () =>
      import('./features/symbol-detail/symbol-detail').then((m) => m.SymbolDetail),
  },
  { path: '**', redirectTo: '' },
];
