export interface EnvelopeMeta {
  requestId: string;
  timestamp: string;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: EnvelopeMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: EnvelopeMeta;
}
