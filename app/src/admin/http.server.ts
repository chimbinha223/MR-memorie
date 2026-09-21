export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...Object.fromEntries(new Headers(headers)),
    },
  });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    origin !== new URL(request.url).origin ||
    request.headers.get("x-mr-admin") !== "1" ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new ApiError(403, "Pedido não autorizado. Atualize a página e tente novamente.");
}
export async function readLimited(request: Request, max: number) {
  const length = request.headers.get("content-length");
  if (length && Number(length) > max)
    throw new ApiError(413, "O ficheiro ou pedido é demasiado grande.");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new ApiError(413, "O ficheiro ou pedido é demasiado grande.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function readJson(request: Request, max = 512000) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Formato de pedido inválido.");
  try {
    return JSON.parse(new TextDecoder().decode(await readLimited(request, max)));
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(400, "Dados inválidos.");
  }
}
export async function api(action: () => Promise<Response>) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    return json({ error: "Não foi possível concluir o pedido. Tente novamente." }, 500);
  }
}
export function edgeCache(): Cache | undefined {
  return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
}
