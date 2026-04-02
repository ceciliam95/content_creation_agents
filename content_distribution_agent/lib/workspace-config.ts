export const workspaceTabs = ["总策划/母稿", "公众号", "小红书", "Twitter", "视频脚本"] as const;

export type WorkspaceTab = (typeof workspaceTabs)[number];

export function shouldShowPublishAction(tab: WorkspaceTab) {
  return tab === "公众号" || tab === "小红书" || tab === "Twitter";
}
