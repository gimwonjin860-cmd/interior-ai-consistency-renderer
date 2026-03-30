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

CONTEXT: Image 1 and Image 2 are two different camera views of the SAME building interior. Image 1 is an untextured SketchUp 3D model. Image 2 is a finished photorealistic render of the same space from a different angle.

YOUR TASK: Produce a finished photorealistic render of Image 1's camera view, matching Image 2's visual style, materials, and atmosphere exactly.

WHAT TO TAKE FROM IMAGE 1:
- All geometry: ceiling shape, wall positions, column positions, floor layout, openings
- Camera angle and perspective
- Position and shape of all LED/media art display panels

WHAT TO TAKE FROM IMAGE 2:
- All surface materials: floor tile, wall finish, column finish, ceiling material
- All lighting: warmth, brightness, shadows, atmosphere
- LED/media art display content: apply Image 2's media art content onto the LED panels found in Image 1
- Overall color palette and mood

CRITICAL RULES:
1. CEILING: Image 1 shows the true ceiling shape. Render it exactly. The wood louvers/slats visible in Image 2 are part of the EXTERIOR facade seen through the glass — they are NOT on the interior ceiling. Never apply louvers to the interior ceiling surface.
2. LED PANELS: Image 1 shows where the LED panels are located. Apply the media art content from Image 2 onto those panels.
3. Never change the spatial structure or camera angle from Image 1.

${customPrompt ? `Additional: ${customPrompt}` : ""}`;

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
