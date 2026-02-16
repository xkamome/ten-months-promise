import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db, hasConfig } from "./config";

const COLLECTION = "game_stats";
const DOC_ID = "surrogate_mother"; // 每個遊戲一個 doc

/**
 * 記錄一次遊戲開始（玩家點擊「開始」時呼叫）
 */
export async function recordGameStart(): Promise<void> {
  if (!db || !hasConfig) {
    console.log("[Analytics] Firebase 未設定，跳過統計");
    return;
  }

  try {
    const ref = doc(db, COLLECTION, DOC_ID);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, {
        play_count: increment(1),
        last_played: new Date().toISOString(),
      });
    } else {
      await setDoc(ref, {
        game_name: "十月之約",
        play_count: 1,
        first_played: new Date().toISOString(),
        last_played: new Date().toISOString(),
      });
    }
    console.log("[Analytics] 遊玩次數 +1");
  } catch (err) {
    console.warn("[Analytics] 記錄失敗:", err);
  }
}

/**
 * 記錄遊戲完成（到達結局時呼叫）
 */
export async function recordGameComplete(ending: string): Promise<void> {
  if (!db || !hasConfig) return;

  try {
    const ref = doc(db, COLLECTION, DOC_ID);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const endingField = `endings.${ending}`;
      await updateDoc(ref, {
        complete_count: increment(1),
        [endingField]: increment(1),
      });
    }
    console.log(`[Analytics] 完成遊戲，結局: ${ending}`);
  } catch (err) {
    console.warn("[Analytics] 記錄失敗:", err);
  }
}

/**
 * 取得遊玩統計
 */
export async function getGameStats(): Promise<{
  play_count: number;
  complete_count: number;
  endings: Record<string, number>;
} | null> {
  if (!db || !hasConfig) return null;

  try {
    const ref = doc(db, COLLECTION, DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        play_count: data.play_count ?? 0,
        complete_count: data.complete_count ?? 0,
        endings: data.endings ?? {},
      };
    }
  } catch (err) {
    console.warn("[Analytics] 讀取失敗:", err);
  }
  return null;
}
