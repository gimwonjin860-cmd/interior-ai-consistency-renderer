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

Image 1 is a 3D architectural model (SketchUp export) — an untextured gray model showing the raw geometry: walls, ceiling, floor, columns, openings, and any LED/media display panels. This defines the complete 3D structure.

Image 2 is a finished interior photograph used ONLY as a material and lighting reference. Extract ONLY these from Image 2:
- Surface materials (floor tile/stone, wall plaster/stone/concrete, column finish)
- Color palette and tones
- Lighting warmth, brightness, and shadow quality

YOUR TASK: Produce a photorealistic render of Image 1's exact 3D geometry with Image 2's materials and lighting applied. Like a 3D artist texturing a model.

RULES:
1. Preserve ALL geometry from Image 1 exactly — ceiling shape, wall layout, column positions, floor plan, camera angle. Do not change any shape or add any new architectural elements.
2. Apply ONLY materials and lighting from Image 2 — do not copy any geometry, furniture arrangement, people, signage, or text from Image 2.
3. Any LED screens or media display panels in Image 1 must remain as glowing digital displays — do not replace them with walls or other surfaces.
4. People may be added naturally to populate the space, but their placement should follow the spatial logic of Image 1, not Image 2.

${customPrompt ? `Additional instructions: ${customPrompt}` : ""}`;

  const parts = [
    { text: systemInstruction },
    {
      inlineData: {
        data: baseImage.split(',')[1],
        mimeType: getMimeType(baseImage)
      }
    },
    {
      inlineData: {
        data: referenceImage.split(',')[1],
        mimeType: getMimeType(referenceImage)
      }
    }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("이미지 생성에 실패했습니다.");
}
