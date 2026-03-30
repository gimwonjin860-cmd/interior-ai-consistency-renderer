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

  const systemInstruction = `You are a photorealistic architectural visualization expert. You will receive two images:
- Image 1 = BASE (Form): defines the 3D structure, spatial layout, camera angle, and all architectural geometry
- Image 2 = REFERENCE (Style): defines ONLY the material finishes, colors, and lighting mood

YOUR TASK: Re-render Image 1's exact space using Image 2's material palette.

═══ ABSOLUTE DO NOT CHANGE (from Image 1) ═══
1. CEILING: Keep exactly as-is. If flat white → output must be flat white. No louvers, no slats, no panels.
2. COLUMNS & WALLS: Keep exact shape, position, curvature. Curved surfaces stay curved.
3. LED/MEDIA WALLS: Any glowing screens, digital displays, or media art panels must remain exactly as they appear in Image 1. Do NOT replace with windows or other surfaces.
4. FLOOR PLAN: All walls, columns, openings stay in exact position.
5. CAMERA ANGLE & PERSPECTIVE: Must match Image 1 exactly.
6. PEOPLE & FIGURES: Keep in same positions.

═══ APPLY FROM IMAGE 2 (Style only) ═══
1. FLOOR MATERIAL: Use the exact same flooring material, texture, and color as Image 2.
2. WALL FINISH: Apply Image 2's wall material (stone, plaster, wood, etc.) to the walls of Image 1.
3. COLUMN FINISH: Apply Image 2's column or pillar material to Image 1's columns.
4. CEILING FINISH: If Image 2 has a different ceiling material, apply ONLY the material/color to Image 1's ceiling shape — never change the shape.
5. LIGHTING MOOD: Match Image 2's overall lighting temperature, warmth, and shadow quality.
6. COLOR PALETTE: Overall tones should closely match Image 2.

═══ CRITICAL RULES ═══
- The output space must be RECOGNIZABLE as Image 1's space viewed from the same angle.
- Material fidelity to Image 2 is PARAMOUNT — the output should look like Image 1's geometry dressed in Image 2's materials.
- Never invent new architectural elements not present in Image 1.
- Never remove any element from Image 1.

${customPrompt ? `ADDITIONAL INSTRUCTIONS: ${customPrompt}` : ""}`;

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
