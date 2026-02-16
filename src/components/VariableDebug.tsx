import React from "react";

interface Props {
  variables: Record<string, number | boolean>;
}

const labelMap: Record<string, string> = {
  emotion: "情緒值",
  risk: "風險累積",
};

const VariableDebug: React.FC<Props> = ({ variables }) => {
  const entries = Object.entries(variables);
  if (entries.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "rgba(0,0,0,0.7)",
        padding: "10px 15px",
        borderRadius: "6px",
        fontSize: "15px",
        color: "rgba(255,255,255,0.6)",
        zIndex: 30,
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {entries.map(([key, val]) => (
        <div key={key} style={{ marginBottom: "3px" }}>
          <span style={{ color: "#80CBC4" }}>{labelMap[key] || key}</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}> : </span>
          <span style={{ color: "#FFD54F", fontWeight: "bold" }}>{String(val)}</span>
        </div>
      ))}
    </div>
  );
};

export default VariableDebug;
