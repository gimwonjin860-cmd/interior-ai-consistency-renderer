import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Download, Lock, Unlock, Plus } from 'lucide-react';
import { generateRender } from './services/geminiService';

declare global {
  interface Window {
    aistudio: { hasSelectedApiKey: () => Promise<boolean>; openSelectKey: () => Promise<void>; };
  }
}

type CompareView = 'input1' | 'input2' | 'output';

export default function App() {
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isStyleLocked, setIsStyleLocked] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [compareView, setCompareView] = useState<CompareView>('output');
  const baseInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkApiKey(); }, []);

  const checkApiKey = async () => {
    if (window.aistudio) { const hasKey = await window.aistudio.hasSelectedApiKey(); setApiKeySelected(hasKey); return; }
    if (import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) setApiKeySelected(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'ref') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'base') { setBaseImage(reader.result as string); setCompareView('input1'); }
      else { setReferenceImage(reader.result as string); setCompareView('input2'); }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!baseImage || !referenceImage) { setError('두 이미지를 모두 업로드해주세요.'); return; }
    setIsGenerating(true); setError(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
      const result = await generateRender({ apiKey, baseImage, referenceImage, customPrompt });
      setResultImage(result);
      setHistory(prev => [result, ...prev]);
      setCompareView('output');
    } catch (err: any) {
      setError('렌더링 중 오류가 발생했습니다.');
    } finally { setIsGenerating(false); }
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `render-${Date.now()}.png`;
    link.click();
  };

  const getActiveImage = () => {
    if (compareView === 'input1') return baseImage;
    if (compareView === 'input2') return referenceImage;
    return resultImage;
  };

  const getActiveLabel = () => {
    if (compareView === 'input1') return '공간 구조 (Form)';
    if (compareView === 'input2') return '스타일 참조 (Style)';
    return '렌더링 결과 (Output)';
  };

  if (!apiKeySelected) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-xl font-bold">SKP AI · Style Transfer</div>
          <div className="text-left bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-400 space-y-2">
            <p className="text-white font-bold">.env.local 설정 필요</p>
            <code className="text-orange-400">VITE_GEMINI_API_KEY=your_key</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#111] text-white flex flex-col overflow-hidden" style={{fontFamily: 'Pretendard, -apple-system, sans-serif'}}>
      {/* Top Nav */}
      <header className="h-11 border-b border-white/10 flex items-center px-5 gap-3 shrink-0">
        <span className="text-xs text-white/30">AI Lab</span>
        <span className="text-white/20 text-xs">/</span>
        <span className="text-xs text-white/70">Image to Render</span>
        <div className="ml-auto flex items-center gap-2">
          {resultImage && (
            <button onClick={downloadResult} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-md transition-colors">
              <Download size={11} /> 저장
            </button>
          )}
          <button onClick={() => { setBaseImage(null); setReferenceImage(null); setResultImage(null); setHistory([]); setCompareView('output'); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-md transition-colors">
            <RefreshCw size={11} /> 초기화
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - wider */}
        <aside className="w-72 border-r border-white/10 flex flex-col shrink-0 overflow-y-auto bg-[#161616]">

          {/* Input 1 */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Input 1 · 공간 구조</span>
              {baseImage && (
                <button onClick={() => setBaseImage(null)} className="text-[10px] text-white/20 hover:text-white/50">✕</button>
              )}
            </div>
            <div
              onClick={() => baseInputRef.current?.click()}
              className={`relative rounded-xl border border-dashed cursor-pointer overflow-hidden flex flex-col items-center justify-center transition-all ${
                baseImage ? 'border-white/20 aspect-video' : 'border-white/10 hover:border-white/25 hover:bg-white/3 aspect-video'
              }`}
            >
              <input type="file" ref={baseInputRef} onChange={(e) => handleImageUpload(e, 'base')} className="hidden" accept="image/*" />
              {baseImage ? (
                <>
                  <img src={baseImage} alt="Base" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 hover:opacity-100 text-[10px] text-white bg-black/60 px-2 py-1 rounded">클릭하여 변경</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Upload size={16} className="text-white/30" />
                  </div>
                  <span className="text-[11px] text-white/30">이미지 업로드</span>
                  <span className="text-[10px] text-white/15">JPG, PNG, WebP</span>
                </div>
              )}
            </div>
          </div>

          {/* Input 2 */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Input 2 · 스타일 참조</span>
              <button onClick={() => setIsStyleLocked(!isStyleLocked)}
                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  isStyleLocked ? 'border-white/30 text-white/70 bg-white/10' : 'border-white/10 text-white/30 hover:border-white/20'
                }`}>
                {isStyleLocked ? <><Lock size={8} /> 고정</> : <><Unlock size={8} /> 고정 안함</>}
              </button>
            </div>
            <div
              onClick={() => !isStyleLocked && refInputRef.current?.click()}
              className={`relative rounded-xl border border-dashed overflow-hidden flex flex-col items-center justify-center transition-all aspect-video ${
                referenceImage ? 'border-white/20' : 'border-white/10 hover:border-white/25 hover:bg-white/3'
              } ${isStyleLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input type="file" ref={refInputRef} onChange={(e) => handleImageUpload(e, 'ref')} className="hidden" accept="image/*" disabled={isStyleLocked} />
              {referenceImage ? (
                <>
                  <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                  {!isStyleLocked && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Upload size={16} className="text-white/30" />
                  </div>
                  <span className="text-[11px] text-white/30">이미지 업로드</span>
                  <span className="text-[10px] text-white/15">JPG, PNG, WebP</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1" />

          {/* Render Button */}
          <div className="p-4">
            {error && <p className="text-red-400 text-[10px] mb-2 text-center">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !baseImage || !referenceImage}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                isGenerating || !baseImage || !referenceImage
                  ? 'bg-white/8 text-white/25 cursor-not-allowed border border-white/10'
                  : 'bg-white text-black hover:bg-gray-100 shadow-lg'
              }`}
            >
              {isGenerating
                ? <><RefreshCw size={14} className="animate-spin" /> 렌더링 중...</>
                : <><Plus size={14} /> Render</>
              }
            </button>
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Compare Toggle */}
          <div className="flex items-center gap-1 px-5 py-3 border-b border-white/10 shrink-0">
            <span className="text-[10px] text-white/25 uppercase tracking-widest mr-2">비교</span>
            {(['input1', 'input2', 'output'] as CompareView[]).map((view) => {
              const labels = { input1: 'Input 1', input2: 'Input 2', output: 'Output' };
              const available = view === 'input1' ? !!baseImage : view === 'input2' ? !!referenceImage : !!resultImage;
              return (
                <button
                  key={view}
                  onClick={() => available && setCompareView(view)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    compareView === view
                      ? 'bg-white text-black'
                      : available
                        ? 'text-white/50 hover:text-white/80 hover:bg-white/8'
                        : 'text-white/15 cursor-not-allowed'
                  }`}
                >
                  {labels[view]}
                </button>
              );
            })}
            <div className="ml-auto text-[10px] text-white/20">{getActiveLabel()}</div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden"
            style={{backgroundImage: 'radial-gradient(circle, #ffffff06 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            {isGenerating ? (
              <div className="text-center space-y-4">
                <div className="relative w-14 h-14 mx-auto">
                  <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                  <div className="absolute inset-0 border-2 border-t-white rounded-full animate-spin" />
                </div>
                <p className="text-sm text-white/40">스타일 분석 중...</p>
                <p className="text-[11px] text-white/20">마감재, 조명, 색상 팔레트를 이식하고 있습니다</p>
              </div>
            ) : getActiveImage() ? (
              <div className="flex flex-col items-center gap-4 max-w-5xl w-full h-full">
                <div className="relative flex-1 w-full flex items-center justify-center">
                  <img
                    src={getActiveImage()!}
                    alt={compareView}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  />
                </div>
                {compareView === 'output' && resultImage && (
                  <button
                    onClick={() => { setReferenceImage(resultImage); setIsStyleLocked(true); setCompareView('input2'); }}
                    className="text-[11px] text-white/35 border border-white/10 px-4 py-1.5 rounded-full hover:bg-white/8 hover:text-white/60 transition-all shrink-0"
                  >
                    이 결과물을 스타일 기준으로 고정
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center text-white/15">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/4 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <p className="text-sm">왼쪽에서 이미지를 업로드하세요</p>
              </div>
            )}
          </div>

          {/* Bottom Prompt Bar */}
          <div className="border-t border-white/10 px-5 py-3 flex items-center gap-3 shrink-0">
            <span className="text-[10px] text-white/20 uppercase tracking-widest shrink-0">PROMPT</span>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="추가 프롬프트 입력 (선택사항)..."
              className="flex-1 bg-transparent text-sm text-white/60 placeholder-white/15 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
        </main>

        {/* Right History Panel */}
        <aside className="w-44 border-l border-white/10 flex flex-col shrink-0 bg-[#161616]">
          <div className="px-3 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">히스토리</span>
            {history.length > 0 && (
              <button onClick={() => setHistory([])} className="text-[9px] text-white/15 hover:text-white/40 transition-colors">전체삭제</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {history.length === 0
              ? <p className="text-[10px] text-white/15 text-center pt-6">렌더링 기록 없음</p>
              : history.map((img, i) => (
                <div key={i} onClick={() => { setResultImage(img); setCompareView('output'); }}
                  className={`aspect-video rounded-lg overflow-hidden cursor-pointer transition-all ring-1 ${resultImage === img && compareView === 'output' ? 'ring-white/50' : 'ring-white/5 hover:ring-white/20'}`}>
                  <img src={img} alt={`history-${i}`} className="w-full h-full object-cover" />
                </div>
              ))
            }
          </div>
        </aside>
      </div>
    </div>
  );
}
