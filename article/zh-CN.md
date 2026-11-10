# shadcn 没有 Tree，我补了一个能扛一万行的

`shadcn/ui` 官方有 65 个组件，没有树。做文件浏览器、依赖树、组织架构、AI 编程界面时，这个洞很尴尬：要么装 antd，要么引 react-arborist，要么自己手搓 `role="tree"` 然后祈祷键盘能跑。

先说句实话：社区已经有两个几百星的 tree 实现，都做得不错。但它们都没有同时做到**异步加载子节点**和**万级行虚拟滚动**（且不额外引入依赖）。我盯的就是这个缝隙：[tree-ui](https://github.com/Alan-donk/tree-ui)。

## 我先立了四条规矩

- **运行时零依赖**：不引 Base UI / Radix / 任何 headless 库，只有 React 和你现有的 Tailwind token。
- **以源码方式安装**：`npx shadcn@latest add <url>` 写三个可直接改的文件，不锁 npm 包。
- **真 treeview**：WAI-ARIA 模式、roving tabindex、完整键盘模型，测试里跑 axe。
- **一万行不需要虚拟列表库**：要装 `react-window` 就不算零依赖了。

## 设计一：一个扁平数组，迭代而不是递归

渲染时不递归你的数据。一个 `useMemo` 用显式栈走一遍树，产出当前可见行：

```ts
{ id, node, level, parentId, posinset, setsize, hasChildren }
```

这个扁平数组是键盘导航、typeahead、区间选择、虚拟滚动和 ARIA 元数据的唯一数据源。一万个节点就是一次线性遍历，也没有递归爆栈风险。

## 设计二：60 行实现虚拟滚动

行高固定 32px，已知 `scrollTop` 和视口高度，可见区间就是算术：

```ts
const start = max(0, floor(scrollTop / 32) - overscan)
const end   = min(total, ceil((scrollTop + viewport) / 32) + overscan)
```

上下两个 padding 撑起没挂载的行。关键细节：`aria-posinset` / `aria-setsize` 按**完整树**算，不是按窗口算。所以读屏仍然播报"第 3 个，共 2080 个"，哪怕 DOM 里只有 20 行。

## 设计三：虚拟化下的焦点才是真难点

窗口化会破坏 roving tabindex——想聚焦的行可能根本不存在。最终跑通的方案是三步：

1. 键盘处理只更新 `focusedId`；
2. effect 算出目标索引，把它滚进窗口，并把新的 `scrollTop` 同步进 state；
3. 下一帧那一行已经渲染出来，再 `focus()`。

Home/End、方向键、typeahead 全走这条路。另外必须守住一条：焦点不在树内时，effect 绝不去抢焦点。这个判断比滚动本身更容易出错。

## 设计四：过滤只改视图，不改你的状态

`filter` 是同一份数据上的视图：保留命中和它们的祖先、强制展开祖先、丢掉不命中的分支、把命中片段包进 `<mark>`。用户的展开集合和选中集合完全不动，清空过滤就回到原来的样子。这个"只读视图"的约束，让过滤在虚拟滚动之后加得相当便宜。

## 设计五：异步子节点 + 重试

`loadChildren` 首次展开时调用，按节点 id 缓存；失败渲染重试按钮并通过 polite live region 播报，加载中用 `aria-busy`。不需要任何数据请求库。

## 测试到底做了什么

40 个 Vitest 用例，包含对渲染树的 axe 扫描。其中 13 个是这次新加的：过滤时祖先展开、命中高亮、清空后状态恢复、窗口行数、滚动换窗口、键盘聚焦到未挂载行。registry 产物会被安装到一个临时项目里单独 type-check，npm 构建会真的打包并 import。把"我机器上能跑"变成"从 registry 装下来能跑"，靠的就是这一步。

## 体积

- 3 个源文件，registry 内联 JSON 约 36 kB；
- npm 构建 ESM + `.d.ts`，**15 kB** tarball，零运行时依赖；
- 40 个测试，6 个文件。

## 装上试试

```bash
npx shadcn@latest add https://alan-donk.github.io/tree-ui/r/tree.json
```

在线 Demo（2080 行虚拟滚动、过滤、异步加载、多选）：<https://alan-donk.github.io/tree-ui/>

## 它不是什么

不是数据表格。还没有拖拽、没有列对齐、没有三态勾选。这些应该先进 issue，而不是塞进一个假装自己是平台的 v0.2.0。先做小，才有机会拿真实用户的需求决定下一步做什么。

如果你的需求是"shadcn 原生、键盘完整、能扛大仓库的树"，这个就是。如果你今天就要拖拽排序，去用更成熟的库更划算——这没什么不好。
