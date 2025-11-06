import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";

// Caminhos das tatuagens
const URL_TATTOOS = [
  "/tattoos/tattoo1.png",
  "/tattoos/tattoo2.png",
  "/tattoos/tattoo3.png",
  "/tattoos/tattoo4.png",
];

// ---------------- Tatuagem arrastável e transformável ---------------- //
function DraggableTattoo({ src, isSelected, onSelect, controls }) {
  const [image] = useImage(src);
  const shapeRef = useRef();
  const trRef = useRef();
  const [attrs, setAttrs] = useState({ x: 200, y: 200 });

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        image={image}
        ref={shapeRef}
        x={attrs.x}
        y={attrs.y}
        scaleX={controls.scale}
        scaleY={controls.scaleY || controls.scale}
        rotation={controls.rotation}
        opacity={controls.opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) =>
          setAttrs({ ...attrs, x: e.target.x(), y: e.target.y() })
        }
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          keepRatio={false} // 🔥 permite deformar livremente (modo GIMP)
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}

// ---------------- Imagem do corpo ---------------- //
function BodyImage({ imageURL, stageSize }) {
  const [image] = useImage(imageURL);
  return (
    <KonvaImage
      image={image}
      width={stageSize.width}
      height={stageSize.height}
    />
  );
}

// ---------------- Componente principal ---------------- //
export default function TattooOverlay() {
  const [bodyImage, setBodyImage] = useState(null);
  const [tattoos, setTattoos] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [controls, setControls] = useState({
    scale: 1,
    rotation: 0,
    opacity: 0.8,
  });

  const stageRef = useRef();
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth * 0.6,
    height: window.innerHeight * 0.7,
  });

  // Atualiza tamanho do canvas ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth * 0.6,
        height: window.innerHeight * 0.7,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleBodyUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBodyImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleTattooClick = (src) => {
    setTattoos([...tattoos, src]);
  };

  const handleControlChange = (key, value) => {
    setControls({ ...controls, [key]: value });
  };

  const handleDeleteTattoo = () => {
    if (selectedIndex !== null) {
      const updated = [...tattoos];
      updated.splice(selectedIndex, 1);
      setTattoos(updated);
      setSelectedIndex(null);
    }
  };

  const handleSaveImage = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "tatuagem-final.png";
    link.href = uri;
    link.click();
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <h2>🎨 Estúdio Virtual de Tatuagem</h2>

      {!bodyImage && (
        <label
          style={{
            background: "#444",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          📸 Carregar corpo
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleBodyUpload}
          />
        </label>
      )}

      {bodyImage && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 20,
            width: "100%",
          }}
        >
          {/* Canvas principal */}
          <div
            style={{
              flex: "1 1 400px",
              background: "#ccc",
              borderRadius: 10,
              padding: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              ref={stageRef}
              style={{ maxWidth: "100%", borderRadius: 10 }}
            >
              <Layer>
                <BodyImage imageURL={bodyImage} stageSize={stageSize} />
                {tattoos.map((src, i) => (
                  <DraggableTattoo
                    key={i}
                    src={src}
                    isSelected={selectedIndex === i}
                    onSelect={() => setSelectedIndex(i)}
                    controls={
                      selectedIndex === i
                        ? controls
                        : { scale: 1, rotation: 0, opacity: 1 }
                    }
                  />
                ))}
              </Layer>
            </Stage>
          </div>

          {/* Painel lateral de controles */}
          {selectedIndex !== null && (
            <div
              style={{
                width: 240,
                background: "#f9f9f9",
                borderRadius: 10,
                padding: 15,
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <h4>🛠 Ajustes</h4>

              <label>
                Zoom ({controls.scale.toFixed(2)})
                <input
                  type="range"
                  min="0.3"
                  max="2"
                  step="0.05"
                  value={controls.scale}
                  onChange={(e) =>
                    handleControlChange("scale", parseFloat(e.target.value))
                  }
                />
              </label>

              <label>
                Rotação ({controls.rotation}°)
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={controls.rotation}
                  onChange={(e) =>
                    handleControlChange("rotation", parseFloat(e.target.value))
                  }
                />
              </label>

              <label>
                Transparência ({Math.round(controls.opacity * 100)}%)
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.05"
                  value={controls.opacity}
                  onChange={(e) =>
                    handleControlChange("opacity", parseFloat(e.target.value))
                  }
                />
              </label>

              <button
                onClick={handleDeleteTattoo}
                style={{
                  background: "#ff4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                }}
              >
                🗑 Remover
              </button>

              <button
                onClick={handleSaveImage}
                style={{
                  background: "#2ecc71",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                }}
              >
                💾 Salvar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grade de tatuagens disponíveis */}
      <div style={{ marginTop: 20 }}>
        <h4>Tatuagens disponíveis:</h4>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
          }}
        >
          {URL_TATTOOS.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Tattoo ${i + 1}`}
              style={{
                width: 80,
                height: 80,
                cursor: "pointer",
                borderRadius: 8,
                border: "2px solid #ddd",
              }}
              onClick={() => handleTattooClick(src)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
