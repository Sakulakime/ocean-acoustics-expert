# ocean-acoustics-expert

[English](README.md) | 简体中文

水声学专家智能体及其知识库，可安装到 Claude Code、Codex、OpenCode 和 DeepSeek-TUI。

本专家涵盖声传播建模和面向声呐的信号处理：声速结构、传输损失、射线和高斯波束方法、波数积分、简正波、抛物方程、宽带传播、环境噪声、混响、声呐方程、波束形成、匹配场处理，以及声波在内波和其他海洋波动中的传播。它还知道如何通过捆绑的 MATLAB 辅助工具为 BELLHOP、KRAKEN 和 RAM 构建输入、运行和绘图。

它优先从笔记中回答问题。它会读取中心文档、路由映射和概念索引，然后读取能够解决问题的最小笔记集：《计算海洋声学》(COA) 的章节笔记、求解器笔记、运行手册和可视化标准。只有当笔记不足时，它才会读取书籍 PDF 的目标页面范围：COA，或通过源笔记读取其他四本书中的某一本。答案中的每个主张都带有证据标签，`[textbook: <source> <section/pages>]` 或 `[inference]`。在所有平台中，该智能体都是只读的：它不能修改文件。

> **本仓库必须保持私有。** 它包含五本受版权保护的书籍 PDF；请参阅[捆绑书籍](#捆绑书籍)。

## 支持的平台

所有平台都从数据文件夹 `~/.local/share/ocean-acoustics-expert/` 中读取知识库的已安装副本。

| 平台 | 智能体文件 | 只读保护方式 | 路由技能 | 书籍 PDFs |
|---|---|---|---|---|
| Claude Code | `~/.claude/agents/ocean-acoustics-expert.md` | `tools: [Read, Grep, Glob]` | `~/.claude/skills/ocean-acoustics-router`，指向共享文件夹的链接 | 读取页面范围 |
| Codex | `~/.codex/agents/ocean-acoustics-expert.toml` | `sandbox_mode = "read-only"` | 从 `~/.agents/skills` 读取 | 使用 `pdftotext` 打印页面范围 |
| OpenCode | `~/.config/opencode/agents/ocean-acoustics-expert.md`（子智能体） | 一个 `permission` 块，拒绝 edit、bash、web 和 task，允许读取数据文件夹 | 从 `~/.agents/skills` 读取 | 不打开 PDFs；而是说明要读取的书籍和页面范围 |
| DeepSeek-TUI（`dst`） | `~/.dsh/agents/ocean-acoustics-expert.md` | `tools: [Read, Grep, Glob]` | 从 `~/.agents/skills` 读取 | 读取页面范围 |

路由技能 `ocean-acoustics-router` 位于共享技能文件夹 `~/.agents/skills/` 中。它通过笔记路由水声学问题，并将深度工作交给专家。

数据文件夹包含：

```
~/.local/share/ocean-acoustics-expert/
├── knowledge/        知识库的已安装副本，包括书籍 PDFs
├── matlab/           MATLAB 求解器辅助工具
├── local-paths.yaml  本地路径映射：本机 Acoustics Toolbox 的位置
├── manifest.json     安装写入的所有文件和链接
└── backups/          安装替换或删除的所有内容
```

## 系统要求

- Node.js 22 或更高版本。
- 对此私有 GitHub 仓库的读取权限。npm 使用 git 获取它，因此 git 必须能够进行身份验证：SSH 密钥或具有访问权限的凭据助手。
- 对于 Codex 的书籍回退：来自 poppler-utils 的 `pdftotext`。
- 可选：MATLAB 和 Acoustics Toolbox，用于求解器辅助工具（参见 `tools/matlab/README.md`）。

## 安装

安装固定标签。npx 会缓存包，因此固定标签可以获得已知版本，而不是过时的缓存副本：

```sh
npx github:<owner>/ocean-acoustics-expert#v0.1.0 install --dry-run
npx github:<owner>/ocean-acoustics-expert#v0.1.0 install
```

`<owner>` 是托管仓库的 GitHub 账户。该包约为 95 MB，几乎全部是书籍 PDFs。

- `--dry-run` 打印本地路径映射和安装将执行的每个操作，但不更改任何内容。
- 在终端中运行时，安装会询问要安装到哪些平台：列出全部四个平台，并标明是否找到。用方向键移动，空格勾选（`a` 全选/全不选），回车确认，esc 或 Ctrl+C 取消。存在配置文件夹的平台（`~/.claude`、`~/.codex`、`~/.config/opencode`、`~/.dsh`）默认勾选；后续安装则默认勾选已记录的平台。
- 在做任何更改之前，安装会显示将执行的操作数量，列出将要备份的每个路径，并询问是否继续。`--dry-run` 不会询问。
- `--harness` 直接指定平台，跳过选择列表，每个平台一次：`--harness claude --harness opencode`。`--yes`（`-y`）跳过所有询问。没有终端时（管道、CI）安装从不询问：依次使用 `--harness`、已记录的平台、存在的平台。
- 后续安装会保留已记录的平台。要更改它们，在选择列表中重新勾选，或使用 `--harness` 传递完整的新列表。
- 在覆盖或删除任何非自己写入的内容之前，安装会将其复制到 `backups/<timestamp>/`。它自己的未更改文件会直接替换。它还会清理此包替换的手动设置的路径，并首先进行备份。
- 安装是幂等的：在没有任何更改的情况下再次运行它不会执行任何操作。

之后，检查结果：

```sh
npx github:<owner>/ocean-acoustics-expert#v0.1.0 doctor
```

### 使用专家

- **Claude Code:** 提出水声学问题。路由技能会进行路由，或请求 `ocean-acoustics-expert` 智能体。
- **Codex:** 要求 Codex 使用 `ocean-acoustics-expert` 智能体。
- **OpenCode:** 提及 `@ocean-acoustics-expert`，或让主智能体将问题交给它。
- **DeepSeek-TUI:** 提出水声学问题。路由技能会进行路由，或请求 `ocean-acoustics-expert` 智能体。

## 链接模式和拷贝模式

**拷贝模式**是包不是 git 检出时的默认模式，这是 npx 的情况。安装会将知识库和 MATLAB 辅助工具复制到数据文件夹中。要更新，请安装较新的标签。

**链接模式**是 git 检出时的默认模式，用于处理知识库。数据文件夹的 `knowledge/` 和 `matlab/` 是指向检出的 `knowledge/`（编写副本）和 `tools/matlab/` 的链接，因此对编写副本的编辑会立即到达所有平台。MATLAB 配置 `oae_local_paths.m` 被写入检出的 `tools/matlab/`，git 会忽略它。

```sh
git clone git@github.com:<owner>/ocean-acoustics-expert.git
cd ocean-acoustics-expert
node bin/ocean-acoustics-expert.js install --dry-run
node bin/ocean-acoustics-expert.js install
```

使用 `--mode link` 或 `--mode copy` 强制指定模式；链接模式需要检出。要将安装从一种模式切换到另一种模式，请先卸载。在链接模式下，保持检出在原位：如果它移动，链接会断开（`doctor` 会报告这一点），直到重新安装。

## 路径覆盖

**Acoustics Toolbox。** 本地路径映射记录两个 Acoustics Toolbox 树的位置。求解器辅助工具需要它们；专家的其余部分无需它们即可工作。安装会在你的主文件夹中搜索最多五层深度，跳过隐藏文件夹、`node_modules` 和符号链接：

| 条目 | 标志 | 识别方式 |
|---|---|---|
| `at_2023` | `--at-2023 <dir>` | 名称包含 `2023` 且包含 `RAM/ram.exe` 的文件夹 |
| `at_2020` | `--at-2020 <dir>` | 名称包含 `2020` 且包含 `linux-bin/bellhop.exe` 和 `Matlab/Plot/plotshd.m` 的文件夹 |

标志会覆盖搜索。后续安装会重用记录的位置，因此你只需传递一次标志。没有匹配项或有多个匹配项的条目会被保留为未设置并带有警告；使用其标志重新安装以设置它。

**配置文件夹。** 安装遵循与平台相同的环境变量。相对值会被忽略。对每个命令使用相同的值，否则 `status`、`doctor` 和 `uninstall` 会在错误的位置查找。

| 变量 | 默认值 | 定位 |
|---|---|---|
| `XDG_DATA_HOME` | `~/.local/share` | 数据文件夹，`$XDG_DATA_HOME/ocean-acoustics-expert` |
| `CLAUDE_CONFIG_DIR` | `~/.claude` | Claude Code 的配置文件夹 |
| `CODEX_HOME` | `~/.codex` | Codex 的配置文件夹 |
| `DSH_HOME` | `~/.dsh` | DeepSeek-TUI（DSH）的主文件夹 |
| `XDG_CONFIG_HOME` | `~/.config` | OpenCode 的配置文件夹，`$XDG_CONFIG_HOME/opencode` |

共享技能文件夹始终是 `~/.agents/skills`。

## 命令

将每个命令作为 `npx github:<owner>/ocean-acoustics-expert#<tag> <command>` 运行，或在检出中作为 `node bin/ocean-acoustics-expert.js <command>` 运行。

| 命令 | 作用 |
|---|---|
| `install` | 安装或更新专家。在终端中会询问安装平台。选项：`--harness <name>`、`--mode link\|copy`、`--dry-run`、`--yes`、`--at-2023 <dir>`、`--at-2020 <dir>`。取消时退出码为 130。 |
| `status` | 显示已安装的版本、模式、平台、数据文件夹、本地路径映射，以及清单列出的文件、链接和备份的数量。 |
| `doctor` | 诊断安装并且不更改任何内容。对于每个问题，它会以非零值退出并打印一行 `FAIL`。 |
| `check` | 检查知识库并运行路由选择用例。用于编辑知识库的人。选项：`--kb <dir>`、`--cases <file>`、`--helpers <dir>`。 |
| `uninstall` | 精确删除清单列出的内容。添加 `--restore` 以恢复安装备份的内容。 |

`doctor` 检查五件事：

1. 本地路径映射的每个条目都存在。未设置的工具箱只会得到 `WARN`。
2. 安装创建的每个符号链接仍然是该链接并且可以解析。
3. 每个平台的智能体文件和共享路由技能都可以解析，命名已安装的中心，并且不命名数据文件夹外的路径。对于 OpenCode，智能体还必须被允许在不询问的情况下读取数据文件夹。
4. 笔记指向的每个书籍 PDF 都在已安装的副本中。它会列出每个缺失的 PDF 以及指向它的笔记。
5. 当安装 OpenCode 时，OpenCode 不会在两个不同的文件夹中看到路由器。通过 Claude 到同一文件夹的链接看到它两次是无害的；OpenCode 会为此记录一个重复名称警告。

`uninstall` 会在删除你在安装后更改的任何文件之前对其进行备份。使用 `--restore`，它会恢复每个路径的最早备份，这会将机器恢复到第一次安装之前的状态。备份保留在数据文件夹的 `backups/` 中。

## 捆绑书籍

`knowledge/sources/` 包含五本书的 PDFs（ADR 0005）：

- Jensen, Kuperman, Porter & Schmidt, *Computational Ocean Acoustics*, 2nd ed. (2011)，默认书籍
- Collins & Siegmann, *Parabolic Wave Equations with Applications* (2019)
- Colosi, *Sound Propagation through the Stochastic Ocean* (2016)
- Etter, *Underwater Acoustic Modeling and Simulation*, 5th ed. (2018)
- Brekhovskikh & Lysanov, *Fundamentals of Ocean Acoustics*, 3rd ed. (2003)

专家仅通过指向其页面的笔记来阅读书籍。COA 有章节笔记。其他四本书中的每一本都有一个源笔记：其页面偏移量和从章节到 PDF 页面的映射，路由映射的回退窗口指向其中。当 COA 不能解决问题时，专家会读取它们的目标页面范围。

它们受版权保护，并且该包重新分发它们。因此：

- 仓库必须保持私有。不要将其公开，并且仅向你可以与之共享书籍的人提供访问权限。
- `package.json` 中的 `"private": true` 阻止 npm 发布该包。从 git 安装，如上所述。
- 一旦提交，删除书籍意味着重写 git 历史。

## 开发

```sh
npm test        # 测试套件：CLI 作为子进程针对伪主文件夹运行
npm run check   # 检查知识库的编写副本
```

领域术语在 `GLOSSARY.md` 中定义，设计决策记录在 `docs/adr/` 中。
