export type PromptTask = "script_to_scenes" | "asset_generation" | "video_generation";

const DEFAULT_SYSTEM_PROMPTS: Record<PromptTask, string> = {
  script_to_scenes: `把输入剧本变成分镜表。输出 txt 文档，格式要求：人物： xxx,  场景 xxx,  分镜： 1.景别， 构图， 运镜， 机位, 光影，时长 （5s)  画面内容： Ma深吸一口气站直身体双手轻压桌面纸张,Eleanor坐在窗边椅子上背脊挺直侧脸冷静, 台词(人物感情)： xxx. 

输出范例： SCENE 1

人物：Eleanor, Duke
地点：Study（书房）

1

景别： Close-up
时长： 5s
构图： Eleanor面部居中，背景书架虚化
运镜： 轻推镜
机位： 平视
光影： 冷光
画面内容： Eleanor缓慢抬头直视前方，双手在胸前交握后慢慢收紧，呼吸压低
台词（VO）：
"Eleanor Hackket is the daughter of an Earl."

要求：1. 在同一场景的人物必须一致，不可出现名字变化。 2.画面内容描写人物具体，可表演。 Do: Ma 神情悲伤，眉头微皱，眼角含泪； Don't: Ma 感到悲伤。 2. 台词必须保持和剧本一致，其他则输出中文。`,
  asset_generation: "",
  video_generation: "",
};

export function getDefaultSystemPrompt(task: PromptTask): string {
  return DEFAULT_SYSTEM_PROMPTS[task];
}
