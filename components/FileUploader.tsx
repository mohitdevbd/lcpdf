
import React, { useCallback, useState } from 'react';
import { UploadCloudIcon, FileTextIcon, XIcon } from './Icons';
import { FileData } from '../types';

interface FileUploaderProps {
  onFilesSelect: (files: FileData[]) => void;
  selectedFiles: FileData[];
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic'];

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelect, selectedFiles }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    const newFiles: FileData[] = [];
    const fileArray = Array.from(files);
    
    // Process files sequentially to maintain order and simplify async handling
    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Please upload PDF, PNG, JPG, or WEBP.`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newFiles.push({
          id: crypto.randomUUID(), // Generate unique ID
          file,
          base64,
          mimeType: file.type
        });
      } catch (err) {
        console.error("Error reading file:", file.name, err);
        setError(`Failed to read file: ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      onFilesSelect([...selectedFiles, ...newFiles]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [selectedFiles, onFilesSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    onFilesSelect(selectedFiles.filter(f => f.id !== id));
    if (selectedFiles.length === 1) setError(null);
  };

  const renderPreview = (fileData: FileData) => {
    if (!fileData.mimeType.startsWith('image/')) return null;

    const src = `data:${fileData.mimeType};base64,${fileData.base64}`;

    return (
      <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
        <img 
          src={src} 
          alt="Preview" 
          className="h-full w-full object-cover"
        />
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept=".pdf, .png, .jpg, .jpeg, .webp, .heic"
          multiple
        />
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className={`p-3 rounded-full ${error ? 'bg-red-100 text-red-500' : 'bg-indigo-100 text-indigo-600'}`}>
            <UploadCloudIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">
              {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
            </p>
            <p className="text-sm text-slate-500 mt-1">PDF, PNG, JPG (Max 10MB each)</p>
          </div>
        </div>
      </div>
      
      {error && <p className="text-sm text-red-500 font-medium px-2">{error}</p>}

      {selectedFiles.length > 0 && (
        <div className="space-y-2 animate-fade-in max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {selectedFiles.map((fileData) => (
            <div key={fileData.id} className="relative flex items-center p-3 bg-white border border-indigo-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              
              {fileData.mimeType.startsWith('image/') ? (
                renderPreview(fileData)
              ) : (
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg flex-shrink-0">
                   <FileTextIcon className="w-6 h-6" />
                </div>
              )}
              
              <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {fileData.file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <button
                onClick={() => removeFile(fileData.id)}
                className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                aria-label="Remove file"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
