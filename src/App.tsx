import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { GameEngine } from "./engine/GameEngine";
import { mockData } from "./data/mockData";
import BackgroundLayer from "./components/BackgroundLayer";
import DialogueBox from "./components/DialogueBox";
import ChoicePanel from "./components/ChoicePanel";
import VariableDebug from "./components/VariableDebug";
import type { Choice } from "./data/types";
import { recordGameStart, recordGameComplete, getGameStats } from "./firebase/analytics";

const APP_VERSION = "v0.2.1";
const APP_DATE = "2026-02-17";

const timeLabel: Record<string, string> = {
  cp1: "第 3 個月",
  cp2: "第 6 個月",
  cp3: "第 9 個月",
  cp4: "第 10 個月",
};

const transitionText: Record<string, string> = {
  cp2: "三個月後⋯⋯",
  cp3: "又過了三個月⋯⋯",
  cp4: "一個月後——預產期到了",
  end_good: "⋯⋯",
  end_neutral: "⋯⋯",
  end_bad: "⋯⋯",
  end_death: "⋯⋯",
};

type Phase = "title" | "playing" | "response" | "transition" | "review";

function App() {
  const engine = useMemo(() => new GameEngine(mockData), []);
  const [, setTick] = useState(0);
  const [phase, setPhase] = useState<Phase>("title");
  const [fadeClass, setFadeClass] = useState<"" | "fade-out" | "fade-in">("");
  const [transText, setTransText] = useState("");
  const transitionTarget = useRef<string | null>(null);
  const [playCount, setPlayCount] = useState<number | null>(null);
  const hasRecordedEnd = useRef(false);

  useEffect(() => {
    const unsub = engine.subscribe(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, [engine]);

  // 載入遊玩次數
  useEffect(() => {
    getGameStats().then((stats) => {
      if (stats) setPlayCount(stats.play_count);
    });
  }, []);

  const dialogue = engine.getCurrentDialogue();
  const scene = engine.getCurrentScene();
  const isChoice = engine.isAtChoice();
  const choices = isChoice ? engine.getCurrentChoices() : [];
  const isEnd = engine.isEnd();
  const variables = engine.getVariables();
  const progress = engine.getProgress();
  const isEnding = engine.isEnding();
  const sceneId = scene?.scene_id ?? "";
  const responseText = engine.getResponse();

  const character = dialogue ? engine.getCharacter(dialogue.character) : null;

  // 到達結局時記錄
  useEffect(() => {
    if (isEnding && !hasRecordedEnd.current) {
      hasRecordedEnd.current = true;
      recordGameComplete(sceneId);
    }
  }, [isEnding, sceneId]);

  // 開始遊戲
  const handleStart = useCallback(() => {
    engine.start();
    setPhase("playing");
    hasRecordedEnd.current = false;
    recordGameStart().then(() => {
      // 更新顯示的次數
      getGameStats().then((stats) => {
        if (stats) setPlayCount(stats.play_count);
      });
    });
  }, [engine]);

  // 推進對話
  const handleAdvance = useCallback(() => {
    if (phase === "response") {
      // response 讀完 → 開始轉場
      const nextScene = engine.getPendingTransitionScene();
      if (nextScene) {
        transitionTarget.current = nextScene;
        setTransText(transitionText[nextScene] ?? "⋯⋯");
        setFadeClass("fade-out");
        setPhase("transition");
        // fade-out 完成後顯示過場文字
        setTimeout(() => {
          // 跳到新場景
          engine.completeTransition();
          // 過場文字顯示一會兒
          setTimeout(() => {
            setFadeClass("fade-in");
            setPhase("playing");
            // fade-in 結束後清除
            setTimeout(() => setFadeClass(""), 800);
          }, 1500);
        }, 800);
      }
      return;
    }
    engine.advance();
  }, [engine, phase]);

  // 選擇選項
  const handleChoice = useCallback(
    (choice: Choice) => {
      engine.selectChoice(choice);
      // 如果有 response，進入 response 階段
      if (choice.response) {
        setPhase("response");
      } else {
        // 沒有 response，直接轉場
        const nextScene = engine.getPendingTransitionScene();
        if (nextScene) {
          transitionTarget.current = nextScene;
          setTransText(transitionText[nextScene] ?? "⋯⋯");
          setFadeClass("fade-out");
          setPhase("transition");
          setTimeout(() => {
            engine.completeTransition();
            setTimeout(() => {
              setFadeClass("fade-in");
              setPhase("playing");
              setTimeout(() => setFadeClass(""), 800);
            }, 1500);
          }, 800);
        }
      }
    },
    [engine]
  );

  const handleRestart = useCallback(() => {
    setPhase("title");
  }, []);

  const handleShowReview = useCallback(() => {
    setPhase("review");
  }, []);

  // ===== 開始畫面 =====
  if (phase === "title") {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Noto Sans TC', sans-serif",
          cursor: "pointer",
        }}
        onClick={handleStart}
      >
        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 16, letterSpacing: 6, marginBottom: 20 }}>
          互動式文字遊戲
        </div>
        <h1 style={{
          color: "#e0e0e0", fontSize: 42, fontWeight: 300, letterSpacing: 8, marginBottom: 15,
          textShadow: "0 0 30px rgba(255,255,255,0.1)",
        }}>
          十月之約
        </h1>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 16, marginBottom: 60 }}>
          你的每一個選擇，都將影響故事的走向
        </div>
        <div style={{
          color: "rgba(255,255,255,0.4)", fontSize: 17, letterSpacing: 3,
          animation: "blink 2s infinite",
        }}>
          點擊任意處開始
        </div>
        {/* 遊玩次數 */}
        {playCount !== null && (
          <div style={{
            position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.2)", fontSize: 13,
          }}>
            已有 {playCount} 人體驗過這個故事
          </div>
        )}
        {/* 版本號 */}
        <div style={{
          position: "absolute", bottom: 15, right: 20,
          color: "rgba(255,255,255,0.15)", fontSize: 12,
        }}>
          {APP_VERSION} · {APP_DATE}
        </div>
      </div>
    );
  }

  // ===== 結局回顧 =====
  if (phase === "review") {
    const history = engine.getChoiceHistory();
    return (
      <div
        style={{
          width: "100vw", height: "100vh", overflow: "auto",
          fontFamily: "'Noto Sans TC', sans-serif", background: "#0a0a0a",
        }}
      >
        <div style={{ maxWidth: 650, margin: "0 auto", padding: "40px 20px" }}>
          <h2 style={{ color: "#e0e0e0", textAlign: "center", marginBottom: 30, fontWeight: 400 }}>
            你的選擇歷程
          </h2>
          {history.map((record, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.05)", borderLeft: "3px solid #3498db",
              padding: "15px 20px", marginBottom: 15, borderRadius: "0 6px 6px 0",
            }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 6 }}>
                {record.checkpoint}
              </div>
              <div style={{ color: "#e0e0e0", fontSize: 17, lineHeight: 1.6 }}>
                {record.choiceText}
              </div>
            </div>
          ))}
          <div style={{
            marginTop: 30, padding: 20, background: "rgba(255,255,255,0.03)",
            borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginBottom: 8 }}>最終數值</div>
            <div style={{ color: "#80CBC4", fontSize: 16 }}>
              情緒值：{String(variables.emotion)} ／ 風險累積：{String(variables.risk)}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <button onClick={handleRestart} style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#e0e0e0", padding: "14px 34px", fontSize: 16, cursor: "pointer", borderRadius: 4,
            }}>
              重新開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dialogue || !scene) {
    return <div style={{ color: "white", padding: 40 }}>Loading...</div>;
  }

  // ===== 轉場黑幕 =====
  const showBlackOverlay = phase === "transition";

  return (
    <div
      style={{
        width: "100vw", height: "100vh", position: "relative", overflow: "hidden",
        fontFamily: "'Noto Sans TC', 'Noto Sans JP', sans-serif",
      }}
    >
      <BackgroundLayer sceneId={sceneId} />

      {/* 淡入淡出遮罩 */}
      <div
        style={{
          position: "absolute", inset: 0, background: "#000", zIndex: 50, pointerEvents: "none",
          opacity: fadeClass === "fade-out" || showBlackOverlay ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      >
        {/* 過場文字 */}
        {showBlackOverlay && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              color: "rgba(255,255,255,0.5)", fontSize: 26, letterSpacing: 4, fontWeight: 300,
            }}>
              {transText}
            </div>
          </div>
        )}
      </div>

      {/* 頂部 */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, padding: "15px 20px 10px" }}>
        <div style={{
          color: "rgba(255,255,255,0.5)", fontSize: 15, marginBottom: 8,
          display: "flex", justifyContent: "space-between",
        }}>
          <span>十月之約</span>
          <span>{scene.scene_name}</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress * 100}%`, borderRadius: 2,
            background: isEnding ? "rgba(255,255,255,0.4)" : "linear-gradient(90deg, #3498db, #2980b9)",
            transition: "width 0.8s ease",
          }} />
        </div>
      </div>

      {/* 左上角時間 */}
      {timeLabel[sceneId] && (
        <div style={{
          position: "absolute", top: 55, left: 20,
          color: "rgba(255,255,255,0.35)", fontSize: 24, fontWeight: "bold", letterSpacing: 2, zIndex: 30,
        }}>
          {timeLabel[sceneId]}
        </div>
      )}

      <VariableDebug variables={variables} />

      {/* 顯示 response（選項後的反應） */}
      {phase === "response" && responseText ? (
        <DialogueBox
          characterName=""
          characterColor="#BDBDBD"
          text={responseText}
          onAdvance={handleAdvance}
          isEnd={false}
        />
      ) : isChoice ? (
        <ChoicePanel choices={choices} onSelect={handleChoice} />
      ) : (
        <DialogueBox
          characterName={character?.display_name ?? ""}
          characterColor={character?.color ?? "#ffffff"}
          text={dialogue.text}
          onAdvance={handleAdvance}
          isEnd={isEnd}
        />
      )}

      {/* 版本號 */}
      <div style={{
        position: "absolute", bottom: 5, right: 10,
        color: "rgba(255,255,255,0.1)", fontSize: 11, zIndex: 5,
      }}>
        {APP_VERSION}
      </div>

      {/* 結局按鈕 */}
      {isEnd && phase === "playing" && (
        <div style={{
          position: "absolute", bottom: 210, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 15, zIndex: 30,
        }}>
          <button onClick={handleShowReview} style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#e0e0e0", padding: "14px 28px", fontSize: 16, cursor: "pointer", borderRadius: 4,
          }}>
            查看選擇歷程
          </button>
          <button onClick={handleRestart} style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)",
            color: "#e0e0e0", padding: "14px 28px", fontSize: 16, cursor: "pointer", borderRadius: 4,
          }}>
            重新開始
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
