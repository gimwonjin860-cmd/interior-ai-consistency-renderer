import { GoogleGenAI } from "@google/genai";

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
  
  const systemInstruction = `
    당신은 고도로 숙련된 인테리어 시각화 전문가입니다. 
    당신의 임무는 '형태(Form)'를 제공하는 이미지와 '스타일(Style)'을 제공하는 이미지를 결합하여 새로운 렌더링을 생성하는 것입니다.
    
    [중요: 역할 분담]
    1. 이미지 1 (Base Image): 공간의 **'형태(Form)'**를 결정합니다. 
       - 벽의 위치, 천장의 높이, 창문의 배치, 가구의 레이아웃, 카메라의 각도(투시도)를 100% 그대로 유지해야 합니다.
       - 공간의 구조적 뼈대는 절대 변경하지 마세요.
    
    2. 이미지 2 (Reference Image): 공간의 **'분위기와 마감(Mood & Finish)'**을 결정합니다.
       - 이 이미지에서는 오직 '재질(Materials)', '색상(Colors)', '조명(Lighting)', '질감(Textures)' 정보만 추출하세요.
       - 이미지 2에 있는 가구의 배치나 방의 구조를 이미지 1로 가져오지 마세요. 
       - 이미지 2는 오직 '마감재 팔레트'와 '조명 가이드'로만 사용합니다.
    
    [수행 지침]
    - 이미지 1의 구조 위에 이미지 2의 마감재(예: 바닥재 종류, 벽지 패턴, 천장 마감)를 입히세요.
    - 이미지 1에 배치된 기존 가구들의 형태는 유지하되, 그 표면 재질과 색상을 이미지 2의 가구 스타일과 일치시키세요.
    - 전체적인 조명의 톤, 밝기, 그림자의 부드러움 등 '분위기'를 이미지 2와 동일하게 맞추세요.
    - 결과물에서 이미지 2의 방 구조가 보인다면 그것은 실패한 작업입니다. 반드시 이미지 1의 방 구조가 유지되어야 합니다.
    
    [추가 요청]
    ${customPrompt}
    
    최종 결과물은 이미지 1의 투시도와 구조를 완벽하게 유지하면서, 이미지 2의 고급스러운 마감과 분위기가 입혀진 극사실적인 인테리어 사진이어야 합니다.
  `;

  const getMimeType = (dataUrl: string): string => {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return match ? match[1] : "image/jpeg";
  };

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
