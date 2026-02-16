import React from "react";

interface Props {
  sceneId: string;
}

const sceneBgMap: Record<string, string> = {
  cp1: "linear-gradient(180deg, #2c3e50 0%, #3498db 50%, #2c3e50 100%)",
  cp2: "linear-gradient(180deg, #2c3e50 0%, #e67e22 50%, #2c3e50 100%)",
  cp3: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  cp4: "linear-gradient(180deg, #1a1a1a 0%, #c0392b 30%, #1a1a1a 100%)",
  end_good: "linear-gradient(180deg, #1a3a2a 0%, #27ae60 50%, #1a3a2a 100%)",
  end_neutral: "linear-gradient(180deg, #2c3e50 0%, #7f8c8d 50%, #2c3e50 100%)",
  end_bad: "linear-gradient(180deg, #1a1a2e 0%, #4a1a4a 50%, #1a1a1a 100%)",
  end_death: "linear-gradient(180deg, #000000 0%, #1a0000 50%, #000000 100%)",
};

const BackgroundLayer: React.FC<Props> = ({ sceneId }) => {
  const bg = sceneBgMap[sceneId] || "linear-gradient(180deg, #111 0%, #333 100%)";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: bg,
        transition: "background 1.0s ease",
        zIndex: 0,
      }}
    />
  );
};

export default BackgroundLayer;
