import React, { useState } from "react";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [downloadHref, setDownloadHref] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>("generated.png");

  async function generate() {
    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      setImgUrl(null);
      return;
    }
    setError("");
    setLoading(true);
    setImgUrl(null);

    try {
      const url = `http://localhost:3000/api/generate?prompt=${encodeURIComponent(
        prompt
      )}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Network response not ok");

      const contentType = resp.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const data = await resp.json();
        if (data && data.image) {
          // data.image may be a data URL or URL string
          setImgUrl(data.image);
          setDownloadHref(data.image);
          if (
            typeof data.image === "string" &&
            data.image.startsWith("data:")
          ) {
            const mime = data.image.substring(5, data.image.indexOf(";"));
            const ext = mime.split("/")[1] || "png";
            setDownloadName(`generated.${ext}`);
          } else {
            setDownloadName("generated.png");
          }
        } else {
          throw new Error("Image data not found in JSON response");
        }
      } else {
        // Binary image
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        // revoke previous object URLs if they were blobs
        if (imgUrl && imgUrl.startsWith("blob:")) URL.revokeObjectURL(imgUrl);
        if (downloadHref && downloadHref.startsWith("blob:"))
          URL.revokeObjectURL(downloadHref);
        setImgUrl(objectUrl);
        setDownloadHref(objectUrl);
        const mime = contentType.split(";")[0];
        const ext = mime.includes("/") ? mime.split("/")[1] : "png";
        setDownloadName(`generated.${ext}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Magic Image Generator</h1>
      <div className="controls">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type something like 'dog', 'sunset'..."
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <button onClick={generate} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="image-container">
        {imgUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl} alt="Generated" />
            {downloadHref && (
              <div style={{ marginTop: 8 }}>
                <a href={downloadHref} download={downloadName}>
                  <button>Download</button>
                </a>
              </div>
            )}
          </>
        ) : (
          <div className="placeholder">No image yet</div>
        )}
      </div>
    </div>
  );
}
