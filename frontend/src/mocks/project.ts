import type {
  DemoAsset,
  DemoNode,
  DemoProject,
  DemoShot,
  DemoStatus,
  NodeKind,
} from "../types/workflow.ts";

export const demoModels = [
  { value: "demo-local", label: "自部署工作流 · Demo" },
  { value: "demo-cloud", label: "云端模型 · Demo" },
  { value: "demo-ollama", label: "Ollama 文本模型 · Demo" },
];

function node(
  id: string,
  label: string,
  code: string,
  kind: NodeKind,
  status: DemoStatus,
  description: string,
): DemoNode {
  return {
    id,
    label,
    code,
    kind,
    status,
    description,
    inputs: ["上游已确认版本（示例引用）"],
    outputs:
      status === "passed"
        ? ["示例产物 v1 · 仅 Mock 元数据"]
        : ["尚无已确认产物 · Demo"],
    config: {
      modelId: "demo-local",
      prompt:
        "电影写实风格，雨夜的旧城街道，克制的冷色调与温暖的窗灯。保持人物外貌、服装与参考资产一致。",
      reviewComment: "",
    },
    logs: [
      "[Demo 09:41] 已加载模拟节点配置",
      "[Demo 09:42] 仅展示 Mock 数据，未提交生成任务",
    ],
    versions: status === "passed" ? ["v1 · 示例版本，未关联真实文件"] : [],
  };
}

const stages: DemoNode[] = [
  node(
    "script-input",
    "剧本输入",
    "01",
    "input",
    "passed",
    "导入故事，让创意开始",
  ),
  node(
    "script-parse",
    "剧本解析",
    "02",
    "generation",
    "passed",
    "提取人物、场景与对白",
  ),
  node(
    "characters",
    "人物资产",
    "03",
    "asset",
    "passed",
    "3 位人物 · 统一视觉标准",
  ),
  node(
    "scenes",
    "场景资产",
    "04",
    "asset",
    "review",
    "2 处场景 · 等待人工确认",
  ),
  node(
    "storyboard",
    "分镜规划",
    "05",
    "generation",
    "passed",
    "规划镜头、时长与运镜",
  ),
  node(
    "splitter",
    "分镜分流器",
    "06",
    "split",
    "passed",
    "3 条独立支线 · Demo",
  ),
  node(
    "merger",
    "分镜汇总器",
    "07",
    "merge",
    "pending",
    "等待全部必需分镜通过",
  ),
  node("audio", "音频字幕", "08", "process", "pending", "原生音频、配音与字幕"),
  node(
    "compose",
    "FFmpeg 合成",
    "09",
    "process",
    "pending",
    "按镜头顺序合成成片",
  ),
  node(
    "final-review",
    "成片审核",
    "10",
    "review",
    "pending",
    "确认画面、节奏与声音",
  ),
  node("export", "MP4 导出", "11", "export", "pending", "成片交付与版本归档"),
];
const characterStage = stages.find((stage) => stage.id === "characters")!;
characterStage.children = [
  node(
    "character-extract",
    "人物识别",
    "C1",
    "process",
    "passed",
    "匹配角色的唯一 ID",
  ),
  node(
    "character-image",
    "三视图生成",
    "C2",
    "generation",
    "passed",
    "人物参考图 · Demo",
  ),
  node(
    "character-review",
    "人物审核",
    "C3",
    "review",
    "passed",
    "确认统一人物形象",
  ),
];
stages.find((stage) => stage.id === "scenes")!.children = [
  node(
    "scene-extract",
    "场景提取",
    "E1",
    "process",
    "passed",
    "整理地点与光线设定",
  ),
  node(
    "scene-image",
    "场景图生成",
    "E2",
    "generation",
    "passed",
    "场景参考图 · Demo",
  ),
  node(
    "scene-review",
    "场景审核",
    "E3",
    "review",
    "review",
    "等待确认场景标准",
  ),
];

function shot(
  id: string,
  name: string,
  description: string,
  duration: number,
  statuses: DemoStatus[],
): DemoShot {
  const names: [string, NodeKind, string][] = [
    ["输入绑定", "input", "绑定人物与场景版本"],
    ["首帧生图", "generation", "生成可审核的首帧"],
    ["图片审核", "review", "检查构图与人物一致性"],
    ["视频生成", "generation", "首帧、动作与镜头运动"],
    ["视频审核", "review", "确认画面、动作和音频"],
    ["素材归档", "process", "保存审核通过的版本"],
  ];
  return {
    id,
    name,
    description,
    duration,
    characterIds: ["char-lin", "char-su"],
    sceneId: "scene-street",
    steps: names.map(([label, kind, desc], i) =>
      node(
        `${id}-s${i + 1}`,
        label,
        `S${i + 1}`,
        kind,
        statuses[i] ?? "pending",
        desc,
      ),
    ),
  };
}

export const mockProject: DemoProject = {
  id: "demo-rain-001",
  name: "雨夜来信",
  episode: "第 01 集",
  format: "16:9 · 电影写实",
  script:
    "雨夜，林夜在旧城街口收到一封没有署名的信。苏璃从咖啡馆走出，认出了信封上的印记。两人循着线索走进老书店，顾先生却早已等在那里。",
  stages,
  shots: [
    shot("shot-01", "雨中的来信", "旧城街口 · 林夜发现信封", 6, [
      "passed",
      "passed",
      "review",
      "pending",
      "pending",
      "pending",
    ]),
    shot("shot-02", "似曾相识", "咖啡馆外 · 苏璃回望街道", 5, [
      "passed",
      "passed",
      "passed",
      "running",
      "pending",
      "pending",
    ]),
    shot("shot-03", "书店的秘密", "老书店 · 暖光中的顾先生", 8, [
      "passed",
      "failed",
      "pending",
      "pending",
      "pending",
      "pending",
    ]),
  ],
  characters: [
    {
      id: "char-lin",
      name: "林夜",
      initials: "林",
      description: "青年男性，深色风衣，沉静敏锐。",
      status: "passed",
      color: "slate",
      version: "v1",
    },
    {
      id: "char-su",
      name: "苏璃",
      initials: "苏",
      description: "青年女性，米白外套，目光坚定。",
      status: "passed",
      color: "sand",
      version: "v1",
    },
    {
      id: "char-gu",
      name: "顾先生",
      initials: "顾",
      description: "中年男性，圆框眼镜，旧书店主人。",
      status: "passed",
      color: "sage",
      version: "v1",
    },
  ] satisfies DemoAsset[],
  scenes: [
    {
      id: "scene-street",
      name: "旧城街口",
      initials: "街",
      description: "雨夜，石板路倒映路灯，咖啡馆临街。",
      status: "passed",
      color: "slate",
      version: "v1",
    },
    {
      id: "scene-bookstore",
      name: "老书店",
      initials: "书",
      description: "木质书架、暖色台灯、窗外雨声。",
      status: "review",
      color: "sand",
      version: "v1",
    },
  ],
};

export function createMockProject(): DemoProject {
  return structuredClone(mockProject);
}
