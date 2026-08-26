/**
 * Optional external data API helper (disabled — no third-party hub).
 */
export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  apiId: string,
  _options: DataApiCallOptions = {},
): Promise<unknown> {
  void _options;
  throw new Error(`External data API is not configured (requested: ${apiId})`);
}
