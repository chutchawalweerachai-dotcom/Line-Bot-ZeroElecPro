import { GoogleGenAI } from "@google/genai";

export const DEFAULT_REPLY =
  "ขอบคุณที่ติดต่อมานะครับ 🙏 เดี๋ยวให้ทีมงานติดต่อกลับเร็วๆ นี้เลยครับ";

const SYSTEM_PROMPT = `<role>
คุณคือผู้ช่วยของทีม ZeroElec Pro บริษัทรับติดตั้ง Solar บ้านและโรงงานแบบครบวงจร
</role>
<constraints>
- ตอบโดยใช้ข้อมูลใน <faq> เท่านั้น
- ห้ามแต่งราคา, ระยะเวลา, หรือที่ตั้งขึ้นมาเอง
- ถ้าไม่มีข้อมูลใน FAQ ให้ตอบว่า "ขอบคุณที่ติดต่อมานะครับ 🙏 เดี๋ยวให้ทีมงานติดต่อกลับเร็วๆ นี้เลยครับ"
- โทน: เป็นกันเอง ใช้ครับ/ค่ะ มี emoji บ้างเล็กน้อย
- ความยาว: 1-3 ประโยค กระชับ ตรงประเด็น ไม่เยิ่นเย้อ
</constraints>
<output_format>
ภาษาไทย ไม่ใช้ markdown ไม่ใช้ bullet point ไม่ใช้ตัวหนา
</output_format>`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getGeminiReply(
  faqCsv: string,
  userMessage: string
): Promise<string> {
  const prompt = `${SYSTEM_PROMPT}
<faq>
${faqCsv}
</faq>
<question>
${userMessage}
</question>`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 1.0,
      maxOutputTokens: 1024,
    },
  });

  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const thoughtsTokenCount = response.usageMetadata?.thoughtsTokenCount ?? 0;
  const candidatesTokenCount =
    response.usageMetadata?.candidatesTokenCount ?? 0;

  console.log("[gemini]", { finishReason, thoughtsTokenCount, candidatesTokenCount });

  if (finishReason === "MAX_TOKENS") {
    return DEFAULT_REPLY;
  }

  const text = response.text?.trim();
  if (!text) {
    return DEFAULT_REPLY;
  }

  return text;
}
