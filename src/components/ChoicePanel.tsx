import React from "react";
import type { Choice } from "../data/types";

interface Props {
  choices: Choice[];
  onSelect: (choice: Choice) => void;
}

const ChoicePanel: React.FC<Props> = ({ choices, onSelect }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%)",
        padding: "30px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        zIndex: 20,
        minHeight: "200px",
        justifyContent: "center",
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: "16px",
          marginBottom: "8px",
        }}
      >
        — 請選擇 —
      </div>
      {choices.map((choice, index) => (
        <button
          key={index}
          onClick={() => onSelect(choice)}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#e0e0e0",
            padding: "14px 40px",
            fontSize: "17px",
            cursor: "pointer",
            borderRadius: "4px",
            width: "80%",
            maxWidth: "500px",
            transition: "all 0.2s ease",
            textAlign: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
          }}
        >
          {choice.option_text}
        </button>
      ))}
    </div>
  );
};

export default ChoicePanel;
