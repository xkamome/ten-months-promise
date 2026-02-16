// ===== Google Sheet 對應的資料型別 =====

export interface Scene {
  scene_id: string;
  scene_name: string;
  bg_image: string;
  bgm: string;
}

export interface Dialogue {
  id: number;
  scene_id: string;
  character: string; // 角色 ID 或 "→CHOICE:xxx"
  text: string;
  expression: string;
}

export interface Choice {
  choice_id: string;
  option_text: string;
  condition: string; // e.g. "girl_affection>=3"
  effect: string; // e.g. "girl_affection+1"
  next_scene: string;
  response: string; // 選完後顯示的反應對話
}

export interface Character {
  character_id: string;
  display_name: string;
  default_image: string;
  color: string;
}

export interface VariableDef {
  var_name: string;
  default_value: string;
  description: string;
}

// ===== 引擎內部用的型別 =====

export interface GameState {
  currentSceneId: string;
  dialogueIndex: number;
  variables: Record<string, number | boolean>;
  isShowingChoice: boolean;
  currentChoiceId: string | null;
}

export interface SaveData {
  save_id: string;
  scene_id: string;
  dialogue_index: number;
  variables: Record<string, number | boolean>;
  timestamp: string;
}

export interface GameData {
  scenes: Scene[];
  dialogues: Dialogue[];
  choices: Choice[];
  characters: Character[];
  variableDefs: VariableDef[];
}
