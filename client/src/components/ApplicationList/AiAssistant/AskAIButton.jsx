import React from "react";
import "./ai.css";

export default function AskAIButton({ label = "Ask AI", onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
