# ocean-acoustics-expert

[English](README.md) | 简体中文

水声学专家智能体及其知识库，可安装到 Claude Code、Codex、OpenCode 和 DeepSeek-TUI。

本专家涵盖声传播建模和面向声呐的信号处理：声速结构、传输损失、射线和高斯波束方法、波数积分、简正波、抛物方程、宽带传播、环境噪声、混响、声呐方程、波束形成、匹配场处理，以及声波在内波和其他海洋波动中的传播。它还知道如何通过捆绑的 MATLAB 辅助工具为 BELLHOP、KRAKEN 和 RAM 构建输入、运行和绘图。对于 UMPE，项目提供编译运行指南和只读的 Node.js 输入校验器。

它按主题选择主要教材，优先读取有实质内容的本地笔记。复杂问题会主动核对其他相关书籍，即使 COA 已能回答主要问题；答案或跨书核对缺少证据时，才读取 PDF 的目标页段。仅发现目录或页码不算完成技术核对。选书规则见 [book selection](knowledge/book-selection.md)。答案中的每个主张都带有证据标签，`[textbook: <source> <section/pages>]` 或 `[inference]`。该智能体是只读的：在 Claude Code、Codex 和 OpenCode 中由平台阻止它修改文件；DeepSeek-TUI 无法对技能做这种限制，只能靠其指令约束。

本仓库不包含书籍 PDF：把你自己的副本放进知识库，即可启用书籍回退（参见[书籍](#书籍)）。没有它们，专家仍然根据笔记回答。

## 支持的平台

所有平台都从数据文件夹 `~/.local/share/ocean-acoustics-expert/` 中读取知识库的已安装副本。

| 平台 | 智能体文件 | 只读保护方式 | 路由技能 | 书籍 PDFs |
|---|---|---|---|---|
| Claude Code | `~/.claude/agents/ocean-acoustics-expert.md` | `tools: [Read, Grep, Glob]` | `~/.claude/skills/ocean-acoustics-router`，指向共享文件夹的链接 | 读取页面范围 |
| Codex | `~/.codex/agents/ocean-acoustics-expert.toml` | `sandbox_mode = "read-only"` | 从 `~/.agents/skills` 读取 | 使用 `pdftotext` 打印页面范围 |
| OpenCode | `~/.config/opencode/agents/ocean-acoustics-expert.md`（子智能体） | 一个 `permission` 块，拒绝 edit、bash、web 和 task，允许读取数据文件夹 | 从 `~/.agents/skills` 读取 | 不打开 PDFs；而是说明要读取的书籍和页面范围 |
| DeepSeek-TUI（`dst`） | `~/.dsh/skills/ocean-acoustics-expert/SKILL.md`（技能形式：DSH 没有命名智能体） | 仅靠指令约束；DSH 没有按技能限制工具的机制 | 从 `~/.agents/skills` 读取 | 使用 `pdftotext` 打印页面范围 |

路由技能 `ocean-acoustics-router` 位于共享技能文件夹 `~/.agents/skills/` 中。它通过笔记路由水声学问题，并将深度工作交给专家。

数据文件夹包含：

```
~/.local/share/ocean-acoustics-expert/
├── knowledge/        知识库的已安装副本；你的书籍 PDF 放在 knowledge/sources/
├── matlab/           MATLAB 求解器辅助工具
├── local-paths.yaml  本地路径映射：本机求解器目录（含 UMPE）
├── manifest.json     安装写入的所有文件和链接
└── backups/          安装替换或删除的所有内容
```

## 系统要求

- Node.js 22 或更高版本。仅校验 UMPE 输入不需要 Fortran 编译器或 MATLAB。
- 在 Linux 上编译 UMPE 需自备 UMPE v1.1 源码、`gfortran` 和 `make`。应用可选的 `ex4b` 补丁还需 `patch`；从本仓库复测 UMPE 自带算例还需 Python 3.10+。
- 可选：git，用于从 GitHub 安装或使用仓库检出。
- 可选：你自己的五本书的 PDF，用于书籍回退（参见[书籍](#书籍)）。
- 对于 Codex 和 DeepSeek-TUI 的书籍回退：来自 poppler-utils 的 `pdftotext`。
- 可选：MATLAB 和 Acoustics Toolbox，用于求解器辅助工具（参见 `tools/matlab/README.md`）。

## 安装

安装 npm 上的最新稳定版本，无需手动填写版本：

```sh
npx --yes ocean-acoustics-expert@latest install --dry-run
npx --yes ocean-acoustics-expert@latest install
```

每次更新时重新运行上述安装命令。包维护者完成一次性 Trusted Publisher 授权后，已发布的 GitHub Release 会通过[发布流程](docs/releasing.md)自动同步对应版本到 npm；稳定版更新 `latest`，预发布版使用 `next`。工作流和 npm registry 验收通过后才算发布完成。`npx --yes` 只跳过 npm 下载确认，安装器仍会询问平台和确认安装。

如需固定版本：

```sh
npx --yes ocean-acoustics-expert@0.3.0 install
```

Windows 上安装器创建的目录链接使用绝对目标的 junction；POSIX 系统使用目录 symlink。重新安装、`doctor` 和 `uninstall` 兼容已有的相对链接记录。目录链接备份会保留目标并恢复为 junction，即使目标已不存在；文件 symlink 仍需要系统权限。无法仅凭目标路径的命名空间前缀判断缺少目录类型记录的旧失效链接。安装中断后，使用相同平台和模式重新运行修复后的安装器，并检查报告的备份。Linux 回归测试不替代 Windows 实机验证。

包小于 1 MB。安装后，把你的书籍 PDF 复制到 `~/.local/share/ocean-acoustics-expert/knowledge/sources/`（参见[书籍](#书籍)）。

- `--dry-run` 打印本地路径映射和安装将执行的每个操作，但不更改任何内容。
- 在终端中运行时，安装会询问要安装到哪些平台：列出全部四个平台，并标明是否找到。用方向键移动，空格勾选（`a` 全选/全不选），回车确认，esc 或 Ctrl+C 取消。存在配置文件夹的平台（`~/.claude`、`~/.codex`、`~/.config/opencode`、`~/.dsh`）默认勾选；后续安装则默认勾选已记录的平台。
- 在做任何更改之前，安装会显示将执行的操作数量，列出将要备份的每个路径，并询问是否继续。`--dry-run` 不会询问。
- `--harness` 直接指定平台，跳过选择列表，每个平台一次：`--harness claude --harness opencode`。`--yes`（`-y`）跳过所有询问。没有终端时（管道、CI）安装从不询问：依次使用 `--harness`、已记录的平台、存在的平台。
- 后续安装会保留已记录的平台。要更改它们，在选择列表中重新勾选，或使用 `--harness` 传递完整的新列表。
- 在覆盖或删除任何非自己写入的内容之前，安装会将其复制到 `backups/<timestamp>/`。它自己的未更改文件会直接替换。它还会清理此包替换的手动设置的路径，并首先进行备份。
- 安装是幂等的：在没有任何更改的情况下再次运行它不会执行任何操作。

之后，检查结果：

```sh
npx --yes ocean-acoustics-expert@latest doctor
```

### 使用专家

- **Claude Code:** 提出水声学问题。路由技能会进行路由，或请求 `ocean-acoustics-expert` 智能体。
- **Codex:** 用自然语言要求专家子代理，例如 `派一个 ocean-acoustics-expert 子代理回答：……`。主代理创建子代理时选择已安装的 `ocean-acoustics-expert` 角色；是否自动委派还取决于当前会话指令及可用能力。该角色配置 `sandbox_mode = "read-only"`。`$ocean-acoustics-router` 在主会话中加载路由技能，仅加载技能不等于已经启动专家子代理。更新仓库后需要重新安装以刷新生成的角色和路由技能，并在新会话中确认说明已更新。
- **OpenCode:** 提及 `@ocean-acoustics-expert`，或让主智能体将问题交给它。
- **DeepSeek-TUI:** 运行 `/ocean-acoustics-expert <问题>`（也会出现在 `/skills` 中）。专家在主智能体内运行，因此只读仅靠其指令约束。普通的水声学问题会经过路由技能。

## 链接模式和拷贝模式

**拷贝模式**是包不是 git 检出时的默认模式，这是 npx 的情况。安装会将知识库和 MATLAB 辅助工具复制到数据文件夹中。要更新，请重新运行上面的 npm 安装命令。

**链接模式**是 git 检出时的默认模式，用于处理知识库。数据文件夹的 `knowledge/` 和 `matlab/` 是指向检出的 `knowledge/`（编写副本）和 `tools/matlab/` 的链接，因此对编写副本的编辑会立即到达所有平台。MATLAB 配置 `oae_local_paths.m` 被写入检出的 `tools/matlab/`，git 会忽略它。

```sh
git clone https://github.com/Sakulakime/ocean-acoustics-expert.git
cd ocean-acoustics-expert
node bin/ocean-acoustics-expert.js install --dry-run
node bin/ocean-acoustics-expert.js install
```

使用 `--mode link` 或 `--mode copy` 强制指定模式；链接模式需要检出。要将安装从一种模式切换到另一种模式，请先卸载。在链接模式下，保持检出在原位：如果它移动，链接会断开（`doctor` 会报告这一点），直到重新安装。

## 路径覆盖

**求解器位置。** 本地路径映射记录两个 Acoustics Toolbox 目录和独立的 UMPE 源码目录。只有在本机运行相应求解器时才需要其目录。安装会在你的主文件夹中搜索最多五层深度，跳过隐藏文件夹、`node_modules` 和符号链接：

| 条目 | 标志 | 识别方式 |
|---|---|---|
| `at_2023` | `--at-2023 <dir>` | 名称包含 `2023` 且包含 `RAM/ram.exe` 的文件夹 |
| `at_2020` | `--at-2020 <dir>` | 名称包含 `2020` 且包含 `linux-bin/bellhop.exe` 和 `Matlab/Plot/plotshd.m` 的文件夹 |
| `umpe_root` | `--umpe-root <dir>` | 解压后的 UMPE 源码目录，含 `pemp.f`, `phase2.f`, `makefile` |

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

将每个命令作为 `npx --yes ocean-acoustics-expert@latest <command>` 运行，或在检出中作为 `node bin/ocean-acoustics-expert.js <command>` 运行。

| 命令 | 作用 |
|---|---|
| `install` | 安装或更新专家。在终端中会询问安装平台。选项：`--harness <name>`、`--mode link\|copy`、`--dry-run`、`--yes`、`--at-2023 <dir>`、`--at-2020 <dir>`、`--umpe-root <dir>`。取消时退出码为 130。 |
| `validate_umpe_inp [--patched-range-index] [case-dir]` | 只读校验 UMPE 输入和实际输出距离点数，默认按原版 v1.1 检查。仅在使用[公制距离索引补丁](knowledge/runbooks/umpe-runbook.md#preserve-the-official-ex4b-input-mks-range-index-fix)重新编译后指定该选项；不会运行或修改 UMPE。 |
| `status` | 显示已安装的版本、模式、平台、数据文件夹、本地路径映射，以及清单列出的文件、链接和备份的数量。 |
| `doctor` | 诊断安装并且不更改任何内容。每个问题打印一行 `FAIL`，有问题时以非零值退出；`WARN` 行不会导致失败。 |
| `check` | 检查知识库并运行路由选择用例。用于编辑知识库的人。选项：`--kb <dir>`、`--cases <file>`、`--helpers <dir>`。 |
| `uninstall` | 精确删除清单列出的内容。添加 `--restore` 以恢复安装备份的内容。 |

`doctor` 检查五件事：

1. 本地路径映射的每个条目都存在。未设置的工具箱只会得到 `WARN`。
2. 安装创建的每个符号链接仍然是该链接并且可以解析。
3. 每个平台的智能体文件和共享路由技能都可以解析，命名已安装的中心，并且不命名数据文件夹外的路径。对于 OpenCode，智能体还必须被允许在不询问的情况下读取数据文件夹。
4. 笔记指向的每个书籍 PDF 都在已安装的副本中。缺失的书籍只会得到 `WARN`，并说明应放置的位置以及指向它的笔记。
5. 当安装 OpenCode 时，OpenCode 不会在两个不同的文件夹中看到路由器。通过 Claude 到同一文件夹的链接看到它两次是无害的；OpenCode 会为此记录一个重复名称警告。

`uninstall` 会在删除你在安装后更改的任何文件之前对其进行备份。使用 `--restore`，它会恢复每个路径的最早备份，这会将机器恢复到第一次安装之前的状态。备份保留在数据文件夹的 `backups/` 中。

## 书籍

专家的页面范围回退会读取五本书（ADR 0006）：

- Jensen, Kuperman, Porter & Schmidt, *Computational Ocean Acoustics*, 2nd ed. (2011)
- Collins & Siegmann, *Parabolic Wave Equations with Applications* (2019)
- Colosi, *Sound Propagation through the Stochastic Ocean* (2016)
- Etter, *Underwater Acoustic Modeling and Simulation*, 5th ed. (2018)
- Brekhovskikh & Lysanov, *Fundamentals of Ocean Acoustics*, 3rd ed. (2003)

本仓库不包含这些书。把你的副本放进已安装副本的 `knowledge/sources/`（`~/.local/share/ocean-acoustics-expert/knowledge/sources/`；链接模式下为检出的 `knowledge/sources/`），文件名使用 [`knowledge/sources/README.md`](knowledge/sources/README.md) 中列出的名称。笔记中的页码是这些版本的 PDF 页码。安装从不触碰它没有写入的文件，因此你的书籍在重新安装和卸载后都会保留。运行 `doctor` 可查看缺少哪些书。

专家通过源笔记确认书籍版本和 PDF 页码。COA 有章节笔记；其他四本书各增加了一篇经过 PDF 核实的专题笔记，位于 `knowledge/topics/`，分别覆盖 PE 扩展、随机传播、模型评估和波导近似。专题笔记只覆盖明确记录的章节，不代表整本书。缺书或平台无法按页读取 PDF 时，专家使用已有实质笔记，并说明尚缺的证据、书名和页段；来源列表区分通过笔记引用的页码和本次实际读取的 PDF 页码。

链接模式下，笔记修改立即可见。智能体说明和路由技能是安装时生成的文件，更新仓库后需要重新运行安装器才能刷新其指令。

## 开发

```sh
npm test        # 测试套件：CLI 作为子进程针对伪主文件夹运行
npm run check   # 检查知识库的编写副本
```

领域术语在 `GLOSSARY.md` 中定义，设计决策记录在 `docs/adr/` 中。

## 许可证

[MIT](LICENSE)。
