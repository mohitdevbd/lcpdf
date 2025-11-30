
import React, { useState } from 'react';
import { FileData, StructuredSummary, GenerationState, InputMode, ProcessingResult } from './types';
import { generateSummary } from './services/gemini';
import FileUploader from './components/FileUploader';
import SummaryDisplay from './components/SummaryDisplay';
import { AlertCircleIcon, RefreshCwIcon, SparklesIcon, FileTextIcon } from './components/Icons';

const App: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.FILE);
  const [textInput, setTextInput] = useState('');
  
  // State for multiple files
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  
  // State for processing results (Map fileId to result or array)
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'generating' | 'done'>('idle');

  const handleFilesSelect = (files: FileData[]) => {
    setSelectedFiles(files);
    // When files change, clear previous results unless we want to keep them? 
    // For simplicity, let's clear results if user is modifying the upload list before generation
    if (globalStatus !== 'generating') {
      setResults([]);
      setGlobalStatus('idle');
      setActiveTabId(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const handleSubmit = async () => {
    if (inputMode === InputMode.FILE && selectedFiles.length === 0) return;
    if (inputMode === InputMode.TEXT && !textInput.trim()) return;

    setGlobalStatus('generating');
    setResults([]);
    
    if (inputMode === InputMode.TEXT) {
       // Handle Text Input as a single result
       const textId = 'text-input';
       const initialResult: ProcessingResult = {
         fileId: textId,
         fileName: 'Text Input',
         status: 'generating'
       };
       setResults([initialResult]);
       setActiveTabId(textId);

       const startTime = performance.now();
       try {
         const data = await generateSummary(textInput, undefined);
         const endTime = performance.now();
         
         setResults(prev => prev.map(r => r.fileId === textId ? {
           ...r,
           status: 'success',
           data,
           generationTime: endTime - startTime
         } : r));
       } catch (error: any) {
         setResults(prev => prev.map(r => r.fileId === textId ? {
            ...r,
            status: 'error',
            error: error.message
          } : r));
       }
       setGlobalStatus('done');

    } else {
       // Handle Multiple Files
       const initialResults: ProcessingResult[] = selectedFiles.map(file => ({
         fileId: file.id,
         fileName: file.file.name,
         status: 'generating'
       }));
       
       setResults(initialResults);
       // Set first file as active tab initially
       setActiveTabId(selectedFiles[0].id);

       // Process all files concurrently
       await Promise.all(selectedFiles.map(async (file) => {
         const startTime = performance.now();
         try {
           const data = await generateSummary(undefined, file);
           const endTime = performance.now();
           
           setResults(prev => prev.map(r => r.fileId === file.id ? {
             ...r,
             status: 'success',
             data,
             generationTime: endTime - startTime
           } : r));
         } catch (error: any) {
           setResults(prev => prev.map(r => r.fileId === file.id ? {
             ...r,
             status: 'error',
             error: error.message
           } : r));
         }
       }));
       setGlobalStatus('done');
    }
  };

  const resetApp = () => {
    setResults([]);
    setGlobalStatus('idle');
    setTextInput('');
    setSelectedFiles([]);
    setActiveTabId(null);
  };

  const getActiveResult = () => {
    return results.find(r => r.fileId === activeTabId) || results[0];
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
          {results.length > 0 && globalStatus === 'done' && (
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
        {results.length === 0 && globalStatus !== 'generating' && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Turn complex documents into clear insights
            </h2>
            <p className="text-lg text-slate-600">
              Upload multiple PDFs or images at once. Our AI will analyze each document, extract key points, and create structured summaries instantly.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          
          {/* Input Section - Hide if we have results to focus on the content */}
          {results.length === 0 && (
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-500 ${globalStatus === 'generating' ? 'opacity-50 pointer-events-none' : ''}`}>
              
              {/* Input Mode Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setInputMode(InputMode.FILE)}
                  className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
                    inputMode === InputMode.FILE 
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Upload Files
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
                    onFilesSelect={handleFilesSelect} 
                    selectedFiles={selectedFiles} 
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
                      (inputMode === InputMode.FILE && selectedFiles.length === 0) ||
                      (inputMode === InputMode.TEXT && !textInput.trim())
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow flex items-center space-x-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span>Generate Summaries</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State - Global */}
          {globalStatus === 'generating' && results.length === 0 && (
             <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Documents</h3>
                <p className="text-slate-500">Processing {selectedFiles.length > 0 ? selectedFiles.length : 1} items with Gemini...</p>
             </div>
          )}

          {/* Results Area */}
          {results.length > 0 && (
            <div className="space-y-6">
              
              {/* Tabs for Multiple Results */}
              {results.length > 1 && (
                <div className="flex overflow-x-auto pb-2 space-x-2 custom-scrollbar">
                  {results.map((result) => (
                    <button
                      key={result.fileId}
                      onClick={() => setActiveTabId(result.fileId)}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border
                        ${activeTabId === result.fileId 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }
                      `}
                    >
                      <FileTextIcon className={`w-4 h-4 ${activeTabId === result.fileId ? 'text-indigo-200' : 'text-slate-400'}`} />
                      <span className="max-w-[150px] truncate">{result.fileName || 'Document'}</span>
                      {result.status === 'generating' && (
                         <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin ml-2"></div>
                      )}
                      {result.status === 'success' && (
                        <span className="ml-1 w-2 h-2 bg-green-400 rounded-full"></span>
                      )}
                      {result.status === 'error' && (
                        <span className="ml-1 w-2 h-2 bg-red-400 rounded-full"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Active Result Display */}
              {(() => {
                const activeResult = getActiveResult();
                
                if (activeResult.status === 'generating') {
                   return (
                     <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm animate-pulse">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <h3 className="text-lg font-medium text-slate-800">Analysing {activeResult.fileName}...</h3>
                     </div>
                   );
                }

                if (activeResult.status === 'error') {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-4">
                      <AlertCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-red-800 font-medium mb-1">Analysis Failed</h3>
                        <p className="text-red-600 text-sm">{activeResult.error}</p>
                      </div>
                    </div>
                  );
                }

                if (activeResult.data) {
                  return <SummaryDisplay data={activeResult.data} generationTime={activeResult.generationTime} />;
                }
                
                return null;
              })()}
              
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
