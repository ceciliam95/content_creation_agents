export type PlatformKey = "wechat" | "xiaohongshu" | "twitter" | "videoScript";

export type TwitterVariant = {
  single: string;
  thread: string[];
};

export type MasterDraft = {
  title: string;
  audience: string;
  objective: string;
  keyMessage: string;
  outline: string[];
  platformNotes: string[];
};

export type SessionRecord = {
  id: string;
  title: string;
  createdAt: string;
  selectedPlatforms: PlatformKey[];
  request: string;
  masterDraft: MasterDraft;
  outputs: {
    wechat?: {
      title: string;
      abstract: string;
      body: string;
      cta: string;
    };
    xiaohongshu?: {
      images: string[];
      hook: string;
      body: string;
      tags: string[];
      prompt: string;
    };
    twitter?: TwitterVariant;
    videoScript?: {
      title: string;
      hook: string;
      sections: string[];
      closing: string;
    };
  };
};
