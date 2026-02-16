import type { VariableDef } from "../data/types";

export class VariableSystem {
  private variables: Record<string, number | boolean> = {};

  /** 用 variableDefs 初始化所有變數 */
  init(defs: VariableDef[]) {
    this.variables = {};
    for (const def of defs) {
      if (def.default_value === "true") {
        this.variables[def.var_name] = true;
      } else if (def.default_value === "false") {
        this.variables[def.var_name] = false;
      } else {
        this.variables[def.var_name] = Number(def.default_value) || 0;
      }
    }
  }

  /** 取得變數值 */
  get(name: string): number | boolean {
    return this.variables[name] ?? 0;
  }

  /** 取得所有變數（用於存檔） */
  getAll(): Record<string, number | boolean> {
    return { ...this.variables };
  }

  /** 從存檔恢復 */
  loadFrom(saved: Record<string, number | boolean>) {
    this.variables = { ...saved };
  }

  /**
   * 判斷 condition 字串是否成立
   * 支援: "girl_affection>=3", "has_sword==true", "" (空=永遠成立)
   */
  checkCondition(condition: string): boolean {
    if (!condition || condition.trim() === "") return true;

    // 多條件用 && 分隔
    const parts = condition.split("&&").map((s) => s.trim());
    return parts.every((part) => this.evalSingle(part));
  }

  private evalSingle(expr: string): boolean {
    // 支援: >=, <=, ==, !=, >, <
    const match = expr.match(
      /^(\w+)\s*(>=|<=|==|!=|>|<)\s*(.+)$/
    );
    if (!match) return true;

    const [, varName, op, rawValue] = match;
    const currentVal = this.variables[varName];

    let targetVal: number | boolean;
    if (rawValue === "true") targetVal = true;
    else if (rawValue === "false") targetVal = false;
    else targetVal = Number(rawValue);

    switch (op) {
      case ">=":
        return Number(currentVal) >= Number(targetVal);
      case "<=":
        return Number(currentVal) <= Number(targetVal);
      case ">":
        return Number(currentVal) > Number(targetVal);
      case "<":
        return Number(currentVal) < Number(targetVal);
      case "==":
        return currentVal == targetVal;
      case "!=":
        return currentVal != targetVal;
      default:
        return true;
    }
  }

  /**
   * 執行 effect 字串
   * 支援: "girl_affection+1", "courage-2", "has_sword=true"
   * 多個效果用 , 分隔: "girl_affection+1,courage+1"
   */
  applyEffect(effect: string) {
    if (!effect || effect.trim() === "") return;

    const parts = effect.split(",").map((s) => s.trim());
    for (const part of parts) {
      this.applySingle(part);
    }
  }

  private applySingle(expr: string) {
    // 賦值: has_sword=true
    const assignMatch = expr.match(/^(\w+)=(true|false)$/);
    if (assignMatch) {
      const [, varName, val] = assignMatch;
      this.variables[varName] = val === "true";
      return;
    }

    // 加減: girl_affection+1, courage-2
    const mathMatch = expr.match(/^(\w+)([+-])(\d+)$/);
    if (mathMatch) {
      const [, varName, op, numStr] = mathMatch;
      const current = Number(this.variables[varName]) || 0;
      const num = Number(numStr);
      this.variables[varName] = op === "+" ? current + num : current - num;
      return;
    }

    // 直接賦值數字: courage=5
    const numAssign = expr.match(/^(\w+)=(\d+)$/);
    if (numAssign) {
      const [, varName, val] = numAssign;
      this.variables[varName] = Number(val);
    }
  }
}
