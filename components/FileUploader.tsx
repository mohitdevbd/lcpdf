import React, { useCallback, useState } from 'react';
import { UploadCloudIcon, FileTextIcon, XIcon } from './Icons';
import { FileData } from '../types';

interface FileUploaderProps {
  onFileSelect: (fileData: FileData | null) => void;
  selectedFile: FileData | null;
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic'];

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Please upload PDF, PNG, JPG, or WEBP.");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File too large. Maximum size is 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data without prefix
      const base64 = result.split(',')[1];
      onFileSelect({
        file,
        base64,
        mimeType: file.type
      });
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
            ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleChange}
            accept=".pdf, .png, .jpg, .jpeg, .webp, .heic"
          />
          <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
            <div className={`p-3 rounded-full ${error ? 'bg-red-100 text-red-500' : 'bg-indigo-100 text-indigo-600'}`}>
              <UploadCloudIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-700">
                {isDragging ? 'Drop file here' : 'Click or drag file to upload'}
              </p>
              <p className="text-sm text-slate-500 mt-1">PDF, PNG, JPG (Max 10MB)</p>
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="relative flex items-center p-4 bg-white border border-indigo-200 rounded-xl shadow-sm">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg mr-4">
            <FileTextIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {selectedFile.file.name}
            </p>
            <p className="text-xs text-slate-500">
              {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={removeFile}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            aria-label="Remove file"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
