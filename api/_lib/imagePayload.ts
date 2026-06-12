import type { VercelRequest } from "@vercel/node";

function bufferFromBase64(value: string): Buffer {
  return Buffer.from(value, "base64");
}

function readParsedJsonBody(req: VercelRequest): unknown {
  const body = req.body;
  if (body && typeof body === "object") return body;
  if (typeof body === "string" && body.trim()) {
    return JSON.parse(body) as unknown;
  }
  return null;
}

async function readStreamBody(req: VercelRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Decode a captured JPEG sent as JSON base64 or raw bytes. */
export async function readImageBuffer(req: VercelRequest): Promise<Buffer> {
  const contentType = String(req.headers["content-type"] ?? "");

  if (contentType.includes("application/json")) {
    const parsed = readParsedJsonBody(req) as { image?: string } | null;
    const image = parsed?.image;
    if (typeof image !== "string" || !image.trim()) {
      throw new Error("Missing image in request body");
    }
    return bufferFromBase64(image);
  }

  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    return req.body;
  }

  const streamed = await readStreamBody(req);
  if (streamed.length > 0) return streamed;

  throw new Error("Empty image");
}

export function imageBufferFromBase64(image: string): Buffer {
  const buffer = bufferFromBase64(image);
  if (!buffer.length) throw new Error("Empty image");
  return buffer;
}
