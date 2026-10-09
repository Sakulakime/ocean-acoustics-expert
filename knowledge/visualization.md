---
title: TL / Pressure Field Visualization Standards
type: reference
status: active
---

# TL 场可视化规范

## 色图选择

| 用途 | 色图 | 说明 |
|------|------|------|
| TL 场 | **`jet_r`** | 标准。小 TL（强传播）= 红色/暖色；大 TL（弱传播）= 蓝色/冷色。与 COA 全书插图一致。`jet`（不反转）是错的——会把强信号显示为冷色 |
| 误差 \|ΔTL\| | `hot_r` 或 `Reds` | 0 dB = 白，误差大 = 深色 |
| 幅度 / SPL | `jet_r` | 同 TL |

**为什么用 `jet_r` 而不是 `jet`**：MATLAB `imagesc` 默认纵轴朝下、colorbar 低值在下，`jet` 下端是蓝色，对应小 index → 小 TL → 强信号被显示为冷色，违反直觉。`jet_r` 反转后小 TL（强信号）= 红色，与物理感受一致，也与 COA 书中图例一致。

## 显示范围（caxis / clim）

**关键:要区分两个不同的范围,别混为一谈。**

### (1) 截断范围(clip)——只为去掉非物理零点尖峰
单个零点 `|p|→0` 会产生 300–600 dB 极值,压扁色阶,必须先截断:
```python
TL_MIN, TL_MAX = 60.0, 120.0   # 截断界,去掉 |p|→0 的非物理尖峰
TL = np.clip(TL, TL_MIN, TL_MAX)
```
这只是数据清洗,**不是**最终色标范围。

### (2) 显示色标范围(caxis)——按 AT2020 `plotshd.m` 标准自适应算
**这是权威标准**,来自 Acoustics Toolbox 标准绘图函数
`ACOUSTICS-TOOLS/atWin10_2020_11_4/Matlab/Plot/plotshd.m`(L88-94)。
色标范围**从数据统计自适应算,不要硬编码**:
```python
v = TL[water_mask & np.isfinite(TL)]   # 水体内有效 TL
tlmax = np.median(v) + 0.75 * np.std(v)
tlmax = 10.0 * round(tlmax / 10.0)     # round 到整十(AT2020 要求)
tlmin = tlmax - 50.0                   # 固定 50 dB 动态窗口
```
- AT2020 用 `median + 0.75·std` 自动定上限,再 `tlmax-50` 定下限(**50 dB** 窗口)。
- `caxisrev([tlmin,tlmax])` = `caxis` + 反转 colorbar 方向(配合 `jet_r`)。
- **硬编码窄窗(如 90-120 的 30 dB)会压缩结构对比度**,只在快速 sanity check 时用;
  正式图(论文/开题/对比)必须用 AT2020 自适应 50 dB 窗口。

### (3) 多图对比必须共用同一 caxis（硬要求）
GT vs 预测、模型 A vs 模型 B 并排对比时,**所有 TL 面板必须共用同一个
`[tlmin,tlmax]`**(从 GT 算一次,套到所有面板)。各面板各自 autoscale 会让色标
不一致 → 对比无意义。误差图同理共用一个 `[0, ERR_MAX]`(典型 ERR_MAX=10)。

### 离散标签场(分区/掩膜)不可用连续色标
分区图(0/1/2/3 等离散类别)严禁用 `jet_r`/`viridis` 等连续色标(会被误读为强度递增),
必须 `ListedColormap` + `BoundaryNorm` + 图例(`Patch`),且单独成图,不混进 TL dB 大图。

## 坐标轴

- 深度轴朝下：`origin="upper"`（matplotlib）或 `set(gca,'YDir','reverse')`（MATLAB）
- x 轴：range (km)，从左到右递增
- colorbar 标签：`TL (dB)` 或 `TL (dB re 1 m)`

## MAE 计算规范

误差只在**物理有效水体区域**计算，排除：

1. 海床单元（`water_mask = False`）
2. GT TL 被 clamp 到上限的深零点区（`tl_gt >= TL_MAX - 0.5`，即 `|p|→0` 的非物理格点）

```python
valid = water_mask & (tl_gt < TL_MAX - 0.5)
mae = np.abs(tl_pred - tl_gt)[valid].mean()
```

## Matplotlib 最简模板

```python
import matplotlib.pyplot as plt
import numpy as np

# 1) 截断去尖峰; 2) AT2020 自适应 caxis(从 GT 算,多图共用)
TL_clipped = np.clip(TL, 60, 120)
v = TL_clipped[water_mask & np.isfinite(TL_clipped)]
tlmax = 10.0 * round((np.median(v) + 0.75 * np.std(v)) / 10.0)
tlmin = tlmax - 50.0

fig, ax = plt.subplots()
im = ax.imshow(TL_clipped,
               cmap="jet_r", vmin=tlmin, vmax=tlmax,   # AT2020 50 dB 窗口
               aspect="auto", origin="upper",
               extent=[0, rmax_km, depth_max_m, 0])
cb = fig.colorbar(im, ax=ax, fraction=0.03)
cb.set_label("TL (dB)")
ax.set_xlabel("Range (km)")
ax.set_ylabel("Depth (m)")
```

## MATLAB（AT2020 plotshd.m 原版做法）

```matlab
% caxis 自适应(plotshd.m L88-94),不要硬编码
tlmed = median( tlt(icount) );      % icount = 有效(非零)格点
tlstd = std( tlt(icount) );
tlmax = tlmed + 0.75 * tlstd;
tlmax = 10 * round( tlmax / 10 );   % round 到整十
tlmin = tlmax - 50;                 % 50 dB 窗口

tej = flipud( jet( 256 ) );         % = jet_r
pcolor( rt, zt, tlt ); shading flat;
colormap( tej );
caxisrev( [ tlmin, tlmax ] );       % caxis + colorbar YDir reverse
set( gca, 'YDir', 'Reverse' );
xlabel( 'Range (km)' ); ylabel( 'Depth (m)' );
```
