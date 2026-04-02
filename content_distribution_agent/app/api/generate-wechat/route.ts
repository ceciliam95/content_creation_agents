import { createGenerateWechatHandler, generateWechatBundle } from "@/lib/generate-wechat-route";

export const POST = createGenerateWechatHandler({
  generateWechatBundle
});
