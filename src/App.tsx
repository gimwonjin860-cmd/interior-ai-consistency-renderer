import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Download, Lock, Unlock, Plus, ChevronRight } from 'lucide-react';
import { generateRender } from './services/geminiService';

declare global {
  interface Window {
    aistudio: { hasSelectedApiKey: () => Promise<boolean>; openSelectKey: () => Promise<void>; };
  }
}

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
  const baseInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkApiKey(); }, []);

  const checkApiKey = async () => {
    if (window.aistudio) { const hasKey = await window.aistudio.hasSelectedApiKey(); setApiKeySelected(hasKey); return; }
    if (import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) setApiKeySelected(true);
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) { await window.aistudio.openSelectKey(); setApiKeySelected(true); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'base' | 'ref') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'base') setBaseImage(reader.result as string);
      else setReferenceImage(reader.result as string);
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

  if (!apiKeySelected) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-2xl font-bold">SKP AI · Style Transfer</div>
          {window.aistudio ? (
            <button onClick={handleOpenKeyDialog} className="w-full py-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2">
              API 키 선택 <ChevronRight size={16} />
            </button>
          ) : (
            <div className="text-left bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-400 space-y-2">
              <p className="text-white font-bold">.env.local 설정 필요</p>
              <code className="text-orange-400">VITE_GEMINI_API_KEY=your_key</code>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col" style={{fontFamily: 'Pretendard, -apple-system, sans-serif'}}>
      {/* Top Nav */}
      <header className="h-12 border-b border-white/10 flex items-center px-4 gap-4 shrink-0">
        <div className="text-sm font-bold text-white/40 flex items-center gap-2">
          <span className="text-white">AI Lab</span>
          <span>/</span>
          <span>Image to Render</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {resultImage && (
            <button onClick={downloadResult} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors">
              <Download size={12} /> 저장
            </button>
          )}
          <button onClick={() => { setBaseImage(null); setReferenceImage(null); setResultImage(null); }} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors">
            <RefreshCw size={12} /> 초기화
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-56 border-r border-white/10 flex flex-col shrink-0 overflow-y-auto">
          {/* Form Image */}
          <div className="p-3 border-b border-white/10">
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">공간 구조 (Form)</p>
            <div
              onClick={() => baseInputRef.current?.click()}
              className={`aspect-video rounded-lg border border-dashed cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 transition-colors ${baseImage ? 'border-white/30' : 'border-white/15 hover:border-white/30'}`}
            >
              <input type="file" ref={baseInputRef} onChange={(e) => handleImageUpload(e, 'base')} className="hidden" accept="image/*" />
              {baseImage
                ? <img src={baseImage} alt="Base" className="w-full h-full object-cover" />
                : <><Upload size={16} className="text-white/30" /><span className="text-[10px] text-white/30">구조 사진 업로드</span></>
              }
            </div>
          </div>

          {/* Style Image */}
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">스타일 참조 (Style)</p>
              <button onClick={() => setIsStyleLocked(!isStyleLocked)} className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded transition-colors ${isStyleLocked ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white/60'}`}>
                {isStyleLocked ? <><Lock size={8} />고정</> : <><Unlock size={8} />고정 안함</>}
              </button>
            </div>
            <div
              onClick={() => !isStyleLocked && refInputRef.current?.click()}
              className={`aspect-video rounded-lg border border-dashed overflow-hidden flex flex-col items-center justify-center gap-2 transition-colors ${referenceImage ? 'border-white/30' : 'border-white/15 hover:border-white/30'} ${isStyleLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input type="file" ref={refInputRef} onChange={(e) => handleImageUpload(e, 'ref')} className="hidden" accept="image/*" disabled={isStyleLocked} />
              {referenceImage
                ? <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                : <><Upload size={16} className="text-white/30" /><span className="text-[10px] text-white/30">스타일 사진 업로드</span></>
              }
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Render Button */}
          <div className="p-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !baseImage || !referenceImage}
              className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${isGenerating || !baseImage || !referenceImage ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
            >
              {isGenerating ? <span className="flex items-center justify-center gap-2"><RefreshCw size={14} className="animate-spin" />분석 중...</span> : '+ Render'}
            </button>
            {error && <p className="text-red-400 text-[10px] mt-2 text-center">{error}</p>}
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-8 bg-[#111]" style={{backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)', backgroundSize: '24px 24px'}}>
            {isGenerating ? (
              <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                  <div className="absolute inset-0 border-2 border-t-white rounded-full animate-spin" />
                </div>
                <p className="text-sm text-white/60">스타일 분석 중...</p>
              </div>
            ) : resultImage ? (
              <div className="flex flex-col items-center gap-4 max-w-4xl w-full">
                <img src={resultImage} alt="Result" className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl" />
                <button
                  onClick={() => { setReferenceImage(resultImage); setIsStyleLocked(true); }}
                  className="text-xs text-white/50 border border-white/15 px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  이 결과물을 스타일 기준으로 고정
                </button>
              </div>
            ) : (
              <div className="text-center text-white/20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <p className="text-sm">왼쪽에서 이미지를 업로드하세요</p>
              </div>
            )}
          </div>

          {/* Bottom Prompt Bar */}
          <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
            <span className="text-[10px] text-white/30 uppercase tracking-widest shrink-0">PROMPT</span>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="추가 프롬프트 입력 (선택사항)..."
              className="flex-1 bg-transparent text-sm text-white/70 placeholder-white/20 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
        </main>

        {/* Right History Panel */}
        <aside className="w-48 border-l border-white/10 flex flex-col shrink-0">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-white/40 uppercase tracking-widest">히스토리</span>
            <button onClick={() => { setBaseImage(null); setReferenceImage(null); setResultImage(null); setHistory([]); }} className="text-[9px] text-white/20 hover:text-white/50">전체삭제</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {history.length === 0
              ? <p className="text-[10px] text-white/20 text-center pt-4">렌더링 기록이 없습니다</p>
              : history.map((img, i) => (
                <div key={i} onClick={() => setResultImage(img)} className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-white/30 transition-all">
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
