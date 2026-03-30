/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Camera,
  ChevronRight,
  Download,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateRender } from './services/geminiService';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
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
  const [error, setError] = useState<string | null>(null);

  const baseInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // AI Studio 환경
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
      return;
    }
    // 일반 환경: .env.local의 GEMINI_API_KEY 사용
    if (import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) {
      setApiKeySelected(true);
    }
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    }
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
    if (!baseImage || !referenceImage) {
      setError("공간 사진과 스타일 참조 이미지를 모두 업로드해주세요.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
      const result = await generateRender({
        apiKey,
        baseImage,
        referenceImage,
        customPrompt
      });
      setResultImage(result);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setApiKeySelected(false);
        setError("API 키를 다시 선택해주세요.");
      } else {
        setError("렌더링 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsGenerating(false);
    }
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
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/20">
              <Layers size={40} className="text-white" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Interior Style Transfer</h1>
            <p className="text-gray-400 leading-relaxed">
              참조 이미지의 색감, 재질, 조명 스타일만 추출하여 현재 공간에 자연스럽게 입힙니다.
            </p>
          </div>
          {window.aistudio ? (
            <button
              onClick={handleOpenKeyDialog}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              API 키 선택하기 <ChevronRight size={20} />
            </button>
          ) : (
            <div className="text-left bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 text-sm text-gray-400">
              <p className="font-bold text-white">로컬 실행 방법</p>
              <ol className="space-y-2 list-decimal list-inside">
                <li><code className="text-orange-400">.env.local</code> 파일을 생성하세요</li>
                <li><code className="text-orange-400">VITE_GEMINI_API_KEY=your_key</code> 를 추가하세요</li>
                <li>서버를 재시작하세요</li>
              </ol>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-orange-400 hover:underline mt-2"
              >
                Gemini API 키 발급받기 <ChevronRight size={14} />
              </a>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <Layers size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">Interior Style Transfer</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setBaseImage(null);
              setResultImage(null);
              if (!isStyleLocked) setReferenceImage(null);
            }}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"
            title="초기화"
          >
            <RefreshCw size={20} />
          </button>
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <button 
            onClick={handleOpenKeyDialog}
            className="text-xs font-medium px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            API Key 변경
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Camera size={16} /> 1. 공간의 형태 (Form)
              </h2>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              벽의 위치, 가구 배치, 투시도 등 <b>공간의 구조</b>를 결정하는 원본 사진입니다.
            </p>
            <div 
              onClick={() => baseInputRef.current?.click()}
              className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3 ${
                baseImage ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <input 
                type="file" 
                ref={baseInputRef} 
                onChange={(e) => handleImageUpload(e, 'base')} 
                className="hidden" 
                accept="image/*"
              />
              {baseImage ? (
                <img src={baseImage} alt="Base" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="text-gray-500" />
                  <span className="text-sm text-gray-400 font-medium">구조 원본 사진</span>
                </>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <ImageIcon size={16} /> 2. 분위기와 마감 (Style)
              </h2>
              <button 
                onClick={() => setIsStyleLocked(!isStyleLocked)}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full transition-all ${
                  isStyleLocked ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'
                }`}
              >
                {isStyleLocked ? <Lock size={10} /> : <Unlock size={10} />}
                {isStyleLocked ? '스타일 고정됨' : '고정 안함'}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              재질, 색상, 조명 등 <b>디자인 스타일</b>만 가져올 참조 이미지입니다.
            </p>
            <div 
              onClick={() => !isStyleLocked && refInputRef.current?.click()}
              className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center gap-3 ${
                referenceImage ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              } ${isStyleLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <input 
                type="file" 
                ref={refInputRef} 
                onChange={(e) => handleImageUpload(e, 'ref')} 
                className="hidden" 
                accept="image/*"
                disabled={isStyleLocked}
              />
              {referenceImage ? (
                <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon className="text-gray-500" />
                  <span className="text-sm text-gray-400 font-medium">스타일 참조 이미지</span>
                </>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">3. 상세 요청 (선택)</h2>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="참조 이미지에서 특히 강조하고 싶은 부분이나 추가 변경 사항을 적어주세요."
              className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
            />
          </section>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !baseImage || !referenceImage}
            className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] ${
              isGenerating || !baseImage || !referenceImage
                ? 'bg-white/10 text-gray-500 cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-xl shadow-orange-500/20'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin" />
                스타일 복제 중...
              </>
            ) : (
              <>
                스타일 복제 렌더링 시작
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl h-full min-h-[600px] flex flex-col overflow-hidden relative">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <CheckCircle2 size={18} className="text-orange-500" />
                복제된 렌더링 결과
              </h3>
              {resultImage && (
                <button 
                  onClick={downloadResult}
                  className="flex items-center gap-2 text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Download size={14} /> 이미지 저장
                </button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center p-8 relative">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-6"
                  >
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-bold">참조 이미지의 스타일을 분석 중입니다</p>
                      <p className="text-sm text-gray-500">마감재, 가구, 오브젝트를 정밀하게 이식하고 있습니다...</p>
                    </div>
                  </motion.div>
                ) : resultImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col items-center justify-center gap-4"
                  >
                    <img 
                      src={resultImage} 
                      alt="Result" 
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex gap-4 mt-4">
                      <button 
                        onClick={() => {
                          setReferenceImage(resultImage);
                          setIsStyleLocked(true);
                        }}
                        className="text-[11px] font-bold text-orange-500 border border-orange-500/30 px-4 py-2 rounded-full hover:bg-orange-500/10 transition-all"
                      >
                        이 결과물을 다음 작업의 스타일 기준으로 고정
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-4 opacity-30">
                    <ImageIcon size={80} className="mx-auto" />
                    <p className="text-lg font-medium">왼쪽에서 대상 사진과 참조 사진을 업로드하세요</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-12 text-center text-gray-600 text-xs border-t border-white/5 mt-12">
        <p>© 2026 Interior AI Cloner Platform. Powered by Gemini 3.1 Flash Image.</p>
      </footer>
    </div>
  );
}
