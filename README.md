# Interior AI Consistency Renderer

인테리어 공간의 **구조(Form)는 그대로 유지**하면서, 참조 이미지의 **스타일(색감·재질·조명)만 이식**하는 AI 렌더링 도구입니다.  
Google Gemini의 이미지 생성 API를 사용합니다.

---

## 주요 기능

- **Form / Style 분리 렌더링** — 원본 공간의 벽 구조, 가구 배치, 카메라 앵글을 유지하면서 참조 이미지의 마감재·색상·조명만 교체
- **스타일 고정(Lock)** — 마음에 드는 스타일 참조 이미지를 고정해두고 다른 공간에 반복 적용
- **연속 렌더링 워크플로우** — 결과물을 다음 작업의 스타일 기준으로 즉시 고정 가능
- **이미지 다운로드** — 생성된 렌더링을 PNG로 저장

---

## 시작하기

### 사전 준비

- Node.js 18 이상
- [Gemini API 키](https://aistudio.google.com/apikey)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/your-username/interior-ai-consistency-renderer.git
cd interior-ai-consistency-renderer

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 VITE_GEMINI_API_KEY에 발급받은 키 입력

# 4. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 사용 방법

1. **공간의 형태 (Form)** — 구조를 유지할 원본 공간 사진 업로드
2. **분위기와 마감 (Style)** — 스타일을 가져올 참조 이미지 업로드
3. **상세 요청 (선택)** — 특별히 강조하고 싶은 사항 입력
4. **스타일 복제 렌더링 시작** 클릭

> 💡 결과물이 마음에 들면 "이 결과물을 다음 작업의 스타일 기준으로 고정" 버튼으로 연속 작업 가능

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animation | Motion (Framer Motion) |
| AI | Google Gemini (`gemini-3.1-flash-image-preview`) |

---

## 환경변수

| 변수명 | 설명 |
|--------|------|
| `VITE_GEMINI_API_KEY` | Gemini API 키 (로컬 개발용) |
| `GEMINI_API_KEY` | Gemini API 키 (AI Studio / 서버 환경) |

---

## 프로젝트 구조

```
src/
├── App.tsx               # 메인 UI 컴포넌트
├── main.tsx              # 앱 진입점
├── index.css             # 전역 스타일
└── services/
    └── geminiService.ts  # Gemini API 호출 로직
```

---

## 라이선스

Apache 2.0
