import { Routes } from '@angular/router';

import { CoinDetail } from './pages/coin-detail/coin-detail';
import { CoinList } from './pages/coin-list/coin-list';

export const routes: Routes = [
  { path: '', component: CoinList },
  { path: 'coin/:symbol', component: CoinDetail },
  { path: '**', redirectTo: '' },
];
