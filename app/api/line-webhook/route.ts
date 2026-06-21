import { NextRequest, NextResponse } from "next/server";
import * as line from "@line/bot-sdk";
import { getFaqContent } from "@/lib/sheet";
import { getGeminiReply, DEFAULT_REPLY } from "@/lib/gemini";

const channelSecret = process.env.LINE_CHANNEL_SECRET!;
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN!;

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken,
});

async function handleTextMessage(
  event: line.MessageEvent & { message: line.TextMessage }
): Promise<void> {
  const replyToken = event.replyToken;
  const userMessage = event.message.text;

  let replyText = DEFAULT_REPLY;

  try {
    const faqCsv = await getFaqContent();
    replyText = await getGeminiReply(faqCsv, userMessage);
  } catch (err) {
    console.error("[webhook] handleTextMessage error:", err);
  }

  await client.replyMessage({
    replyToken,
    messages: [{ type: "text", text: replyText }],
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!line.validateSignature(rawBody, channelSecret, signature)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = JSON.parse(rawBody) as line.WebhookRequestBody;

  const textEvents = body.events.filter(
    (e): e is line.MessageEvent & { message: line.TextMessage } =>
      e.type === "message" && e.message.type === "text"
  );

  await Promise.allSettled(textEvents.map(handleTextMessage));

  return new NextResponse("OK", { status: 200 });
}
