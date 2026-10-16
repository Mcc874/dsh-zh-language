/**
 * 简体中文语言约束（DSH 宿主插件）。
 *
 * 为什么不改 system-prompt 的 personaSuffix：
 * 四个内置 agent preset（standard / cordis / ptc / minimal）都会挂载
 * @deepseek-ai/dsh-persona，并以同名段落 deployment:persona-suffix 在
 * preset 作用域内遮蔽掉 dsh-system-prompt 在全局注册的同名段落。
 * 因此部署级 personaSuffix 在任何内置 preset 下都不会进入系统提示词。
 *
 * 本插件改为注册一个名字唯一的全局段落（user:zh-language）：
 * 遮蔽只对同名段落生效，唯一名字不会被 preset 覆盖，段落会出现在系统
 * 提示词的最末尾（order 10201，紧接 deployment:persona-suffix 的 10200）。
 */

const name = "zh-language";
/** 依赖的宿主服务：系统提示词注册表 */
const inject = ["systemPrompt"];
/** 段落顺序：紧随全局部署人设之后，即系统提示词的最后一段 */
const ORDER = 10201;

const TEXT = [
  "## 语言与思考过程（必须遵守）",
  "无论用户使用何种语言提问，你的内部推理与思考过程（reasoning / thinking）必须始终使用简体中文。",
  "最终回复默认使用简体中文，除非用户明确要求使用其他语言。",
  "代码、标识符、命令、文件路径、API 名称与专有名词保留原文，不要翻译。",
  "工具返回内容、日志与引用的原文保持原样，不要为了统一语言而改写它们。"
].join("\n");

function apply(ctx) {
  ctx.effect(() => ctx.systemPrompt.section({
    name: "user:zh-language",
    order: ORDER,
    text: TEXT
  }), "zh-language.section()");
}

export { TEXT, apply, inject, name };
