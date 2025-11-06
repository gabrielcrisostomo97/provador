import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";

const URL_TATTOOS = [
  `${process.env.PUBLIC_URL}/tattoos/tattoo1.png`,
  `${process.env.PUBLIC_URL}/tattoos/tattoo2.png`,
  `${process.env.PUBLIC_URL}/tattoos/tattoo3.png`,
  `${process.env.PUBLIC_URL}/tattoos/tattoo4.png`,
];

function DraggableTattoo({ src, isSelected, onSelect, controls }) {
  const [image] = useImage(src, "anonymous");
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
        scaleY={controls.scale}
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
          keepRatio={false}
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

function BodyImage({ imageURL }) {
  const [image] = useImage(imageURL);
  return <KonvaImage image={image} width={500} height={600} />;
}

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
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>🎨 Estúdio Virtual de Tatuagem</h2>

      {!bodyImage && (
        <div style={{ margin: "20px 0" }}>
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
        </div>
      )}

      {bodyImage && (
        <div style={{ display: "flex", gap: 20 }}>
          <div
            style={{ flex: 1, background: "#ccc", borderRadius: 10, padding: 10 }}
          >
            <Stage
              width={500}
              height={600}
              ref={stageRef}
              style={{ background: "#ddd" }}
            >
              <Layer>
                <BodyImage imageURL={bodyImage} />

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

          {selectedIndex !== null && (
            <div
              style={{
                width: 220,
                background: "#eee",
                borderRadius: 10,
                padding: 10,
              }}
            >
              <h4>🛠 Ajustes</h4>

              <label>
                Zoom
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={controls.scale}
                  onChange={(e) =>
                    handleControlChange("scale", parseFloat(e.target.value))
                  }
                />
              </label>

              <label>
                Rotação
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
                Transparência
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

              <button onClick={handleDeleteTattoo}>🗑 Remover</button>
              <button onClick={handleSaveImage}>💾 Salvar</button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h4>Tatuagens disponíveis:</h4>
        <div style={{ display: "flex", gap: 10 }}>
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
                background: "#fff",
              }}
              onClick={() => handleTattooClick(src)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
