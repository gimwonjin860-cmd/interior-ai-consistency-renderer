import { GoogleGenAI } from "@google/genai";

const getMimeType = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:([^;]+);base64,/);
  return match ? match[1] : "image/jpeg";
};

const getImageDimensions = (dataUrl: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = dataUrl;
  });
};

const cropToRatio = (dataUrl: string, targetWidth: number, targetHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const targetRatio = targetWidth / targetHeight;
      const srcRatio = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcRatio > targetRatio) {
        sw = img.height * targetRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetRatio;
        sy = (img.height - sh) / 2;
      }
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = dataUrl;
  });
};

const getNearestAspectRatio = (width: number, height: number): "1:1" | "4:3" | "16:9" | "3:4" | "9:16" => {
  const ratio = width / height;
  if (ratio > 1.7) return "16:9";
  if (ratio > 1.2) return "4:3";
  if (ratio < 0.6) return "9:16";
  if (ratio < 0.85) return "3:4";
  return "1:1";
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
  const { width: inputW, height: inputH } = await getImageDimensions(baseImage);
  const aspectRatio = getNearestAspectRatio(inputW, inputH);

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
- All geometry exactly: ceiling shape, wall positions, column positions, floor layout, openings, facade / 모든 지오메트리 그대로
- Camera angle and perspective — do NOT change at all / 카메라 앵글 절대 변경 금지
- Position and shape of all LED/media art display panels / LED 패널 위치와 형태

WHAT TO TAKE FROM IMAGE 2 / 이미지 2에서 가져올 것:
- Floor material, color, texture / 바닥 마감재
- Wall finish and color tone / 벽 마감재
- Column surface material / 기둥 마감재
- Ceiling: take NOTHING from Image 2 for the ceiling shape or finish. Render the ceiling exactly as it appears in Image 1. / 천장: 이미지 2에서 천장 관련 어떤 것도 가져오지 마세요. 이미지 1 천장 그대로.
- Lighting warmth, brightness, shadows / 조명 분위기
- Overall color palette and mood / 전체 색상 팔레트
- LED/media art content: apply Image 2's media art onto the LED panels in Image 1 / LED 미디어아트: 이미지 2의 미디어아트를 이미지 1의 LED 패널에 적용

CRITICAL RULES / 절대 규칙:
1. CEILING: Copy ceiling 100% from Image 1. Never add any ceiling element not in Image 1. / 천장은 이미지 1에서 100% 복사. 이미지 1에 없는 천장 요소 절대 추가 금지.
2. FRAMING: Render only what is visible in Image 1's camera frame. Do not add space above, below, or to the sides. / 프레이밍: 이미지 1 카메라 프레임 안에 보이는 것만 렌더링. 위아래 좌우로 공간 추가 절대 금지.
3. LED PANELS: Apply Image 2's media art onto LED panel locations from Image 1. / LED: 이미지 1 위치에 이미지 2 미디어아트 적용.
4. Never copy people, signage, text, or furniture layout from Image 2. / 이미지 2의 사람, 텍스트, 가구 배치 절대 복사 금지.

${customPrompt ? `Additional / 추가: ${customPrompt}` : ""}`;

  const parts = [
    { text: systemInstruction },
    { inlineData: { data: baseImage.split(',')[1], mimeType: getMimeType(baseImage) } },
    { inlineData: { data: referenceImage.split(',')[1], mimeType: getMimeType(referenceImage) } }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: { parts },
    config: { imageConfig: { aspectRatio, imageSize: "1K" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const resultDataUrl = `data:image/png;base64,${part.inlineData.data}`;
      // crop to match input aspect ratio exactly
      return await cropToRatio(resultDataUrl, inputW, inputH);
    }
  }

  throw new Error("이미지 생성에 실패했습니다.");
}
