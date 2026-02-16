import type { GameData, Dialogue, Choice, Character, Scene } from "../data/types";
import { VariableSystem } from "./VariableSystem";

const CHOICE_PREFIX = "→CHOICE:";
const ENDING_MARKER = "→ENDING";

export interface ChoiceRecord {
  checkpoint: string;
  choiceText: string;
}

export class GameEngine {
  private data: GameData;
  private variableSystem: VariableSystem;

  private currentSceneId: string = "";
  private sceneDialogues: Dialogue[] = [];
  private dialogueIndex: number = 0;
  private choiceHistory: ChoiceRecord[] = [];

  // 選完後的反應狀態
  private pendingResponse: string | null = null;
  private pendingNextScene: string | null = null;

  private listeners: Set<() => void> = new Set();

  constructor(data: GameData) {
    this.data = data;
    this.variableSystem = new VariableSystem();
  }

  start() {
    this.variableSystem.init(this.data.variableDefs);
    this.choiceHistory = [];
    this.pendingResponse = null;
    this.pendingNextScene = null;
    const firstScene = this.data.scenes[0];
    if (firstScene) {
      this.goToScene(firstScene.scene_id);
    }
  }

  goToScene(sceneId: string) {
    this.currentSceneId = sceneId;
    this.sceneDialogues = this.data.dialogues.filter(
      (d) => d.scene_id === sceneId
    );
    this.dialogueIndex = 0;
    this.pendingResponse = null;
    this.pendingNextScene = null;
    this.notify();
  }

  advance() {
    if (this.isAtChoice()) return;

    // 如果正在顯示反應，點擊後觸發轉場
    if (this.pendingNextScene) {
      const next = this.pendingNextScene;
      this.pendingResponse = null;
      this.pendingNextScene = null;
      // 通知 App 開始轉場，App 會呼叫 completeTransition
      this.notify();
      // 存下要跳轉的 scene，讓 App 透過 getPendingTransition 取得
      this.pendingNextScene = next;
      this.notify();
      return;
    }

    if (this.dialogueIndex < this.sceneDialogues.length - 1) {
      this.dialogueIndex++;
      this.notify();
    }
  }

  selectChoice(choice: Choice) {
    const scene = this.getCurrentScene();
    this.choiceHistory.push({
      checkpoint: scene?.scene_name ?? "",
      choiceText: choice.option_text,
    });

    if (choice.effect) {
      this.variableSystem.applyEffect(choice.effect);
    }

    // 計算目標場景
    let nextScene: string;
    if (choice.next_scene === ENDING_MARKER) {
      nextScene = this.determineEnding();
    } else {
      nextScene = choice.next_scene;
    }

    // 如果有反應文字，先顯示反應
    if (choice.response) {
      this.pendingResponse = choice.response;
      this.pendingNextScene = nextScene;
      this.notify();
    } else {
      // 沒有反應，直接通知要轉場
      this.pendingNextScene = nextScene;
      this.notify();
    }
  }

  /** App 轉場動畫結束後呼叫，跳到新場景 */
  completeTransition() {
    if (this.pendingNextScene) {
      const next = this.pendingNextScene;
      this.pendingResponse = null;
      this.pendingNextScene = null;
      this.goToScene(next);
    }
  }

  private determineEnding(): string {
    const emotion = Number(this.variableSystem.get("emotion")) || 0;
    const risk = Number(this.variableSystem.get("risk")) || 0;

    if (risk >= 4) {
      const deathChance = Math.min(0.3, risk * 0.05);
      if (Math.random() < deathChance) {
        return "end_death";
      }
    }

    if (emotion >= 7) return "end_good";
    if (emotion >= 4) return "end_neutral";
    return "end_bad";
  }

  // ===== 狀態查詢 =====

  getCurrentDialogue(): Dialogue | null {
    return this.sceneDialogues[this.dialogueIndex] ?? null;
  }

  getCurrentScene(): Scene | null {
    return this.data.scenes.find((s) => s.scene_id === this.currentSceneId) ?? null;
  }

  isAtChoice(): boolean {
    if (this.pendingResponse || this.pendingNextScene) return false;
    const d = this.getCurrentDialogue();
    return d?.character.startsWith(CHOICE_PREFIX) ?? false;
  }

  /** 是否正在顯示選項後的反應 */
  isShowingResponse(): boolean {
    return this.pendingResponse !== null;
  }

  getResponse(): string | null {
    return this.pendingResponse;
  }

  /** 是否有待執行的轉場（沒有 response 但有 nextScene） */
  hasPendingTransition(): boolean {
    return this.pendingNextScene !== null && this.pendingResponse === null;
  }

  getPendingTransitionScene(): string | null {
    return this.pendingNextScene;
  }

  getCurrentChoices(): Choice[] {
    const d = this.getCurrentDialogue();
    if (!d || !d.character.startsWith(CHOICE_PREFIX)) return [];
    const choiceId = d.character.replace(CHOICE_PREFIX, "");
    return this.data.choices
      .filter((c) => c.choice_id === choiceId)
      .filter((c) => this.variableSystem.checkCondition(c.condition));
  }

  getCharacter(characterId: string): Character | null {
    return this.data.characters.find((c) => c.character_id === characterId) ?? null;
  }

  getVariables(): Record<string, number | boolean> {
    return this.variableSystem.getAll();
  }

  getChoiceHistory(): ChoiceRecord[] {
    return [...this.choiceHistory];
  }

  getProgress(): number {
    const cpMap: Record<string, number> = { cp1: 0.25, cp2: 0.5, cp3: 0.75, cp4: 1.0 };
    if (this.currentSceneId.startsWith("end_")) return 1;
    return cpMap[this.currentSceneId] ?? 0;
  }

  isEnding(): boolean {
    return this.currentSceneId.startsWith("end_");
  }

  isEnd(): boolean {
    const d = this.getCurrentDialogue();
    if (!d) return true;
    return (
      this.dialogueIndex === this.sceneDialogues.length - 1 &&
      !this.isAtChoice() &&
      !this.isShowingResponse() &&
      !this.hasPendingTransition()
    );
  }

  getSaveData() {
    return {
      scene_id: this.currentSceneId,
      dialogue_index: this.dialogueIndex,
      variables: this.variableSystem.getAll(),
    };
  }

  loadSaveData(save: {
    scene_id: string;
    dialogue_index: number;
    variables: Record<string, number | boolean>;
  }) {
    this.variableSystem.loadFrom(save.variables);
    this.currentSceneId = save.scene_id;
    this.sceneDialogues = this.data.dialogues.filter(
      (d) => d.scene_id === save.scene_id
    );
    this.dialogueIndex = save.dialogue_index;
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}
