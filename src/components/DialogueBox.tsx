import React, { useEffect, useState } from "react";

interface Props {
  characterName: string;
  characterColor: string;
  text: string;
  onAdvance: () => void;
  isEnd: boolean;
}

const DialogueBox: React.FC<Props> = ({
  characterName,
  characterColor,
  text,
  onAdvance,
  isEnd,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // 打字機效果
  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let index = 0;
    const timer = setInterval(() => {
      index++;
      setDisplayedText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [text]);

  const handleClick = () => {
    if (isTyping) {
      // 點擊跳過打字
      setDisplayedText(text);
      setIsTyping(false);
    } else if (!isEnd) {
      onAdvance();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 100%)",
        padding: "20px 30px",
        minHeight: "180px",
        cursor: "pointer",
        zIndex: 10,
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* 角色名 */}
      {characterName && (
        <div
          style={{
            color: characterColor,
            fontSize: "22px",
            fontWeight: "bold",
            marginBottom: "10px",
            textShadow: `0 0 10px ${characterColor}40`,
          }}
        >
          {characterName}
        </div>
      )}

      {/* 對話文字 */}
      <div
        style={{
          color: "#e0e0e0",
          fontSize: "18px",
          lineHeight: "1.8",
          minHeight: "80px",
        }}
      >
        {displayedText}
        {isTyping && (
          <span style={{ opacity: 0.5, animation: "blink 0.5s infinite" }}>
            ▌
          </span>
        )}
      </div>

      {/* 提示 */}
      {!isTyping && (
        <div
          style={{
            textAlign: "right",
            color: "rgba(255,255,255,0.3)",
            fontSize: "14px",
            marginTop: "5px",
          }}
        >
          {isEnd ? "— END —" : "▼ 點擊繼續"}
        </div>
      )}
    </div>
  );
};

export default DialogueBox;
