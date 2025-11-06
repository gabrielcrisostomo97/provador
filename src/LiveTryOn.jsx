import React, { useRef, useEffect, useState } from "react";

// Importa suas tatuagens
import tattoo1 from "./tatuagens/tattoo1.png";
import tattoo2 from "./tatuagens/tattoo2.png";
import tattoo3 from "./tatuagens/tattoo3.png";
import tattoo4 from "./tatuagens/tattoo4.png";

const tattoos = [
  { name: "Tattoo 1", src: tattoo1 },
  { name: "Tattoo 2", src: tattoo2 },
  { name: "Tattoo 3", src: tattoo3 },
  { name: "Tattoo 4", src: tattoo4},
];

export default function LiveTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [mode, setMode] = useState("camera"); // "camera" ou "photo"
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [tattooImg, setTattooImg] = useState(null);

  const [tattooPos, setTattooPos] = useState({ x: 250, y: 150 });
  const [tattooScale, setTattooScale] = useState(0.6);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Inicia/desliga a câmera
  useEffect(() => {
    if (mode === "camera") {
      async function startCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Erro ao acessar câmera:", err);
        }
      }
      startCamera();
    } else {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
      }
    }
  }, [mode]);

  // Renderização contínua no canvas
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const video = videoRef.current;

    function drawFrame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (mode === "camera" && video?.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
      } else if (mode === "photo" && uploadedPhoto) {
        ctx.drawImage(uploadedPhoto, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      if (tattooImg) {
        const w = tattooImg.width * tattooScale;
        const h = tattooImg.height * tattooScale;
        ctx.drawImage(tattooImg, tattooPos.x, tattooPos.y, w, h);
      }

      requestAnimationFrame(drawFrame);
    }

    drawFrame();
  }, [mode, uploadedPhoto, tattooImg, tattooPos, tattooScale]);

  // Upload de imagem de corpo/foto
  function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => setUploadedPhoto(img);
    img.src = URL.createObjectURL(file);
  }

  // Seleciona a tatuagem
  function handleTattooSelect(src) {
    const img = new Image();
    img.src = src;
    img.onload = () => setTattooImg(img);
  }

  // Eventos do mouse
  function handleMouseDown(e) {
    if (!tattooImg) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const w = tattooImg.width * tattooScale;
    const h = tattooImg.height * tattooScale;

    // Detecta se clicou dentro da tatuagem
    if (
      mouseX >= tattooPos.x &&
      mouseX <= tattooPos.x + w &&
      mouseY >= tattooPos.y &&
      mouseY <= tattooPos.y + h
    ) {
      setDragging(true);
      setOffset({ x: mouseX - tattooPos.x, y: mouseY - tattooPos.y });
    }
  }

  function handleMouseMove(e) {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setTattooPos({ x: mouseX - offset.x, y: mouseY - offset.y });
  }

  function handleMouseUp() {
    setDragging(false);
  }

  // Zoom da tatuagem
  function handleWheel(e) {
    e.preventDefault();
    const newScale = tattooScale + (e.deltaY < 0 ? 0.05 : -0.05);
    setTattooScale(Math.min(Math.max(newScale, 0.2), 2));
  }

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h2>Provador Virtual de Tatuagens 💉</h2>

      {/* Alternar modo */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setMode("camera")}
          style={{
            marginRight: 10,
            backgroundColor: mode === "camera" ? "#0d6efd" : "#888",
            color: "white",
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          📸 Câmera ao Vivo
        </button>

        <button
          onClick={() => setMode("photo")}
          style={{
            backgroundColor: mode === "photo" ? "#0d6efd" : "#888",
            color: "white",
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          🖼️ Escolher Foto
        </button>
      </div>

      {mode === "photo" && (
        <input type="file" accept="image/*" onChange={handleUpload} style={{ marginBottom: 10 }} />
      )}

      <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          border: "2px solid #333",
          borderRadius: 12,
          cursor: dragging ? "grabbing" : "grab",
        }}
      />

      <div style={{ marginTop: 20 }}>
        <h3>Escolha uma tatuagem:</h3>
        <div style={{ display: "flex", justifyContent: "center", gap: 15, flexWrap: "wrap" }}>
          {tattoos.map((t, i) => (
            <img
              key={i}
              src={t.src}
              alt={t.name}
              onClick={() => handleTattooSelect(t.src)}
              style={{
                width: 80,
                height: 80,
                cursor: "pointer",
                border: tattooImg?.src?.includes(t.src)
                  ? "2px solid red"
                  : "1px solid gray",
                borderRadius: 8,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
