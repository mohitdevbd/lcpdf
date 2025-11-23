
import React, { useState } from 'react';
import { FileData, StructuredSummary, GenerationState, InputMode } from './types';
import { generateSummary } from './services/gemini';
import FileUploader from './components/FileUploader';
import SummaryDisplay from './components/SummaryDisplay';
import { AlertCircleIcon, RefreshCwIcon, SparklesIcon } from './components/Icons';

const App: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.FILE);
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [summaryData, setSummaryData] = useState<StructuredSummary | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [generationTime, setGenerationTime] = useState<number>(0);

  const handleFileSelect = (fileData: FileData | null) => {
    setSelectedFile(fileData);
    // Reset previous results when file changes
    if (fileData) setSummaryData(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (inputMode === InputMode.FILE && !selectedFile) return;
    if (inputMode === InputMode.TEXT && !textInput.trim()) return;

    setGenerationState({ status: 'generating' });
    setSummaryData(null);
    setGenerationTime(0);
    
    const startTime = performance.now();

    try {
      const result = await generateSummary(
        inputMode === InputMode.TEXT ? textInput : undefined,
        inputMode === InputMode.FILE && selectedFile ? selectedFile : undefined
      );
      
      const endTime = performance.now();
      setGenerationTime(endTime - startTime);
      
      setSummaryData(result);
      setGenerationState({ status: 'success' });
    } catch (error: any) {
      setGenerationState({ status: 'error', error: error.message });
    }
  };

  const resetApp = () => {
    setSummaryData(null);
    setGenerationState({ status: 'idle' });
    setTextInput('');
    setSelectedFile(null);
    setGenerationTime(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">DocuSummarizer AI</h1>
          </div>
          {summaryData && (
             <button 
              onClick={resetApp}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center space-x-1"
             >
               <RefreshCwIcon className="w-4 h-4" />
               <span>New Summary</span>
             </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Hero / Intro */}
        {!summaryData && generationState.status !== 'generating' && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Turn complex documents into clear insights
            </h2>
            <p className="text-lg text-slate-600">
              Upload a PDF, an image, or paste text. Our AI will extract key points, action items, and create a structured summary instantly.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          
          {/* Input Section - Hide if we have a result to focus on the content */}
          {!summaryData && (
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-500 ${generationState.status === 'generating' ? 'opacity-50 pointer-events-none' : ''}`}>
              
              {/* Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setInputMode(InputMode.FILE)}
                  className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
                    inputMode === InputMode.FILE 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setInputMode(InputMode.TEXT)}
                  className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
                    inputMode === InputMode.TEXT 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Paste Text
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {inputMode === InputMode.FILE ? (
                  <FileUploader 
                    onFileSelect={handleFileSelect} 
                    selectedFile={selectedFile} 
                  />
                ) : (
                  <div className="relative">
                    <textarea
                      value={textInput}
                      onChange={handleTextChange}
                      placeholder="Paste your text here (articles, emails, contracts, etc.)..."
                      className="w-full h-64 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-800 placeholder-slate-400 text-base"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                      {textInput.length} chars
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={
                      (inputMode === InputMode.FILE && !selectedFile) ||
                      (inputMode === InputMode.TEXT && !textInput.trim())
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow flex items-center space-x-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span>Generate Summary</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {generationState.status === 'generating' && (
             <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Document</h3>
                <p className="text-slate-500">Extracting key insights with Gemini...</p>
             </div>
          )}

          {/* Error State */}
          {generationState.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-4">
              <AlertCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-medium mb-1">Analysis Failed</h3>
                <p className="text-red-600 text-sm">{generationState.error}</p>
                <button 
                  onClick={() => setGenerationState({ status: 'idle' })}
                  className="mt-3 text-sm font-medium text-red-700 hover:underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {summaryData && generationState.status === 'success' && (
            <SummaryDisplay data={summaryData} generationTime={generationTime} />
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
