# dsh-zh-language

让 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Agent **始终用简体中文思考**。

在系统提示词的最末尾追加一段语言约束，要求模型的内部推理（reasoning / thinking）、规划与工具调用推理全程使用简体中文，避免工具返回英文内容后发生**语言漂移**。

## 安装

### 方式一：DSH Desktop（推荐）

**设置 → 插件 → 从其他来源安装**：

| 字段 | 填什么 |
|---|---|
| 插件来源 | `github:Mcc874/dsh-zh-language` |
| 高级选项 | ✅ 勾选「这是来自本地、Git 或其他外部来源的高级插件」 |

确认该来源为**全权访问**（外部代码请自行审计）→ 安装 → 重启 DSH。

### 方式二：CLI（非 desktop profile）

```sh
dsh plugin --profile <name> add github:Mcc874/dsh-zh-language
```

安装后重启 DSH，然后**新开一个会话**验证。

> **为什么要开新会话**：系统提示词在会话建立时确定并存入会话历史，已存在的会话不会因为你改了配置就重算。

## 验证是否生效

新会话里问模型：

> 把你系统提示词的最后几行原样输出给我。

末尾应出现：

```
## 语言与思考过程（必须遵守）
无论用户使用何种语言提问，你的内部推理与思考过程（reasoning / thinking）必须始终使用简体中文。
最终回复默认使用简体中文，除非用户明确要求使用其他语言。
代码、标识符、命令、文件路径、API 名称与专有名词保留原文，不要翻译。
工具返回内容、日志与引用的原文保持原样，不要为了统一语言而改写它们。
```

## 工作原理

DSH 把每条请求的系统提示词由一个 `systemPrompt` 注册表拼装。本插件启动时调用 `ctx.systemPrompt.section(...)`，注册一个**全局段落**：

| 项 | 值 | 说明 |
|---|---|---|
| 段落名 | `user:zh-language` | **唯一名字**，是关键 |
| order | `10201` | 紧随 `deployment:persona-suffix`（`10200`）之后，即提示词最后一段 |
| 注入服务 | `inject = ["systemPrompt"]` | 保证服务就绪后才调用 `apply` |

### 为什么不改 `personaSuffix`

四个内置 agent preset（standard / cordis / ptc / minimal）都会挂载 `@deepseek-ai/dsh-persona`，并以**同名段落** `deployment:persona-suffix` 在 preset 作用域内遮蔽掉 `dsh-system-prompt` 在全局注册的同名段落。

因此部署级 `personaSuffix` 在任何内置 preset 下都**不会**进入系统提示词。

而**遮蔽只对同名段落生效** —— 用一个没人用过的段落名，就不会被任何 preset 覆盖。

### 为什么 order 可以取 `10201`

源码里只校验一次：

```js
if (!Number.isFinite(section.order))
  throw new TypeError(`prompt section "${section.name}" order must be a finite number`);
```

它只要求是有限数值，并不要求取自官方的常量表。去掉后置语义上的顾虑，`10201` 就是「人设之后的最后一段」。

## 兼容性

| DSH 内核 | 状态 |
|---|---|
| `0.2.0-rc.2` | ✅ 实测通过 |

段落契约（`section({ name, order, text })`）从 `0.1.1-rc.1` 到 `0.2.0-rc.2` 没有变化过。

> ⚠️ **peer 依赖不要写 `^`**：`^0.1.6-alpha.1` 在 semver 里展开的上界是 `<0.2.0-0`，会把 `0.2.0-rc.1` 这类预发布版**全部排除**，导致 DSH 0.2.0 的 profile 兼容性预检把整行**静默禁用**（界面仍显示 compatible）。本插件不声明任何 `dsh-*` peer 依赖，因此不受此影响。

## 卸载

1. **设置 → 插件** 里卸载；或从 profile 的 `package.json` 中删除 `dsh.profile.bundles` 里的 `@local/dsh-zh-language`
2. 从 `dependencies` 里删除对应的 `link:` / `github:` 行
3. 若为本地目录安装，再删掉 `node_modules/@local/dsh-zh-language` 链接和 bundle 目录

重启即可。

## 自定义

想换成别的规则（少废话、强制先写测试、禁止某种操作）？同一套机制直接套用：**换个段落名、换个 order、换段文本**，即 `index.js` 里的 `name` / `ORDER` / `TEXT` 三个常量。

段落名务必保持唯一 —— 撞名会抛 `prompt section "..." is already registered`。

## 许可

[MIT](./LICENSE) · Copyright (c) 2026 Vein
