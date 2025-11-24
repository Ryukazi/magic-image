import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.get("/api/generate", async (req, res) => {
  const prompt = String(req.query.prompt || "");
  if (!prompt) {
    res.status(400).json({ error: "Missing prompt query parameter" });
    return;
  }

  try {
    const remoteUrl = `https://dens-magic-img.vercel.app/api/generate?prompt=${encodeURIComponent(
      prompt
    )}`;

    // Use the global fetch (Node 18+) — falls back if environment provides fetch
    const response = await fetch(remoteUrl);

    // Copy status
    res.status(response.status);

    // Copy content-type (if present)
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    // Allow CORS for local dev
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send as binary buffer — this handles both image blobs and JSON
    const arr = await response.arrayBuffer();
    const buffer = Buffer.from(arr);
    res.send(buffer);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
