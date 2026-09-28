import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, retry, throwError, timer } from 'rxjs';

/** 統一後的 API 錯誤，message 可直接顯示給使用者 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const MAX_RETRIES = 2;

function isRetryable(err: HttpErrorResponse): boolean {
  return err.status === 0 || err.status >= 500;
}

export function toUserMessage(err: HttpErrorResponse): string {
  if (err.status === 0) return '無法連線到行情伺服器，請檢查網路連線。';
  if (err.status === 400) return '查無此交易對或參數錯誤。';
  if (err.status === 429) return '請求過於頻繁，請稍後再試。';
  if (err.status >= 500) return '行情伺服器暫時無法回應，請稍後再試。';
  return `發生未預期的錯誤（${err.status}）。`;
}

/** 網路 / 5xx 錯誤自動重試，最後統一轉成 ApiError */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (err: HttpErrorResponse, attempt) =>
        isRetryable(err) ? timer(attempt * 500) : throwError(() => err),
    }),
    catchError((err: unknown) =>
      throwError(() =>
        err instanceof HttpErrorResponse ? new ApiError(toUserMessage(err), err.status) : err,
      ),
    ),
  );
