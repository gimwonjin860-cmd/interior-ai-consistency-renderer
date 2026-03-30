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

  const systemInstruction = `You are a photorealistic architectural visualization renderer. You texture 3D models.

Image 1 is a SketchUp 3D architectural model — gray untextured geometry. It shows the exact structure: ceiling shape, walls, columns, floor, LED media panels, camera angle. This is the ONLY source of geometry.

Image 2 is a finished interior photo from a DIFFERENT camera angle of the SAME building. Use it ONLY to extract: floor material, wall material, column material, lighting color temperature and mood. Nothing else.

STRICT RULES — no exceptions:

[GEOMETRY — copy from Image 1 only]
- Ceiling: render EXACTLY as shown in Image 1. If Image 1 has an arched vault with NO louvers inside, output must have an arched vault with NO louvers inside. Louvers or slats visible in Image 2 are on the EXTERIOR facade — do NOT apply them to the interior ceiling.
- All walls, columns, floor layout, openings: follow Image 1 exactly.
- Camera angle and perspective: match Image 1 exactly.
- LED/media display panels: keep the EXACT content shown in Image 1 (clouds, colors, imagery). Do NOT replace with content from Image 2. Do NOT remove them.

[MATERIALS — copy from Image 2 only]
- Floor: same stone/tile finish and color as Image 2.
- Walls: same plaster/concrete/stone finish and tone as Image 2.
- Columns: same surface material as Image 2.
- Lighting: same warmth, color temperature, shadow softness as Image 2.

[NEVER do these]
- Never add louvers or wood slats to the interior ceiling.
- Never replace LED media content with different imagery.
- Never copy geometry, furniture layout, people positions, signage, or text from Image 2.
- Never change the ceiling shape from what is shown in Image 1.

${customPrompt ? `Extra instructions: ${customPrompt}` : ""}

Output: photorealistic render of Image 1's exact 3D geometry with Image 2's material finishes applied.`;

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
