import { GoogleGenAI } from "@google/genai";

const getMimeType = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : "image/jpeg";
};

export async function generateRender({
  apiKey,
  baseImage,
  referenceImage,
  customPrompt
}: {
  apiKey: string;
  baseImage: string;
  referenceImage: string;
  customPrompt: string;
}) {
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are a photorealistic architectural visualization renderer.
당신은 건축 인테리어 시각화 전문 렌더러입니다.

CONTEXT / 배경:
Image 1 and Image 2 are different camera views of the SAME building.
이미지 1과 이미지 2는 동일한 건물을 서로 다른 카메라 앵글에서 찍은 것입니다.
Image 1 is an untextured SketchUp 3D model (gray geometry).
이미지 1은 텍스처가 없는 스케치업 3D 모델입니다 (회색 지오메트리).
Image 2 is a finished photorealistic render of the same building from a different angle.
이미지 2는 같은 건물의 다른 앵글에서 완성된 포토리얼 렌더링입니다.

YOUR TASK / 작업 목표:
Produce a finished photorealistic render of Image 1's camera view, applying Image 2's materials and atmosphere.
이미지 1의 카메라 앵글 그대로, 이미지 2의 마감재와 분위기를 적용하여 완성된 포토리얼 렌더링을 만드세요.

WHAT TO TAKE FROM IMAGE 1 / 이미지 1에서 가져올 것:
- All geometry: ceiling shape, wall positions, column positions, floor layout, openings, facade
- 모든 지오메트리: 천장 형태, 벽 위치, 기둥 위치, 바닥 레이아웃, 개구부, 파사드
- Camera angle and perspective (do NOT change)
- 카메라 앵글과 투시도 (절대 변경 금지)
- Position and shape of all LED/media art display panels
- LED/미디어아트 디스플레이 패널의 위치와 형태

WHAT TO TAKE FROM IMAGE 2 / 이미지 2에서 가져올 것:
- Floor material, color, texture / 바닥 마감재, 색상, 질감
- Wall finish and color tone / 벽 마감재와 색상 톤
- Column surface material / 기둥 표면 마감재
- Ceiling material finish (NOT ceiling shape) / 천장 마감재 (천장 형태는 제외)
- Lighting: warmth, brightness, shadows / 조명: 색온도, 밝기, 그림자
- Overall color palette and mood / 전체 색상 팔레트와 분위기
- LED/media art display content: apply onto the LED panels found in Image 1
- LED/미디어아트 콘텐츠: 이미지 1의 LED 패널 위치에 이미지 2의 미디어아트 콘텐츠를 적용

CRITICAL RULES / 절대 규칙:
1. CEILING SHAPE: Render Image 1's ceiling shape exactly as modeled. Never add or remove ceiling elements.
   천장 형태: 이미지 1의 천장 형태를 정확히 렌더링하세요. 천장 요소를 추가하거나 제거하지 마세요.
2. LOUVERS: If louvers/slats are visible in Image 1, render them. If not visible in Image 1, do NOT add them.
   루버: 이미지 1에 루버/슬랫이 보이면 렌더링하고, 이미지 1에 없으면 절대 추가하지 마세요.
3. LED PANELS: Keep LED panel positions from Image 1. Apply media art content from Image 2 onto them.
   LED 패널: 이미지 1의 LED 패널 위치를 유지하고, 이미지 2의 미디어아트 콘텐츠를 적용하세요.
4. ASPECT RATIO: Maintain the exact same proportions and camera framing as Image 1.
   비율: 이미지 1과 정확히 동일한 비율과 카메라 프레이밍을 유지하세요.
5. Never copy people, signage, text, or furniture layout from Image 2.
   이미지 2의 사람, 사이니지, 텍스트, 가구 배치를 복사하지 마세요.

${customPrompt ? `Additional instructions / 추가 지시사항: ${customPrompt}` : ""}`;

  const parts = [
    { text: systemInstruction },
    { inlineData: { data: baseImage.split(',')[1], mimeType: getMimeType(baseImage) } },
    { inlineData: { data: referenceImage.split(',')[1], mimeType: getMimeType(referenceImage) } }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: { parts },
    config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }

  throw new Error("이미지 생성에 실패했습니다.");
}
