export async function predictParts(imageBuffer: Buffer): Promise<unknown> {
  const form = new FormData();
  const blob = new Blob([imageBuffer], { type: "image/jpeg" });
  form.append("query_image", blob, "capture.jpg");

  const res = await fetch("https://api.brickognize.com/predict/parts/", {
    method: "POST",
    headers: { accept: "application/json" },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Brickognize error ${res.status}: ${text || res.statusText}`);
  }

  return res.json();
}
