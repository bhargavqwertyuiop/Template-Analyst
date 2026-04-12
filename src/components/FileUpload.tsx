/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, FileText, AlertCircle, 
  Loader2, FileSpreadsheet, FileCode,
  ArrowUpCircle
} from 'lucide-react';
import { RawTemplateData } from '../lib/analyzer';

interface FileUploadProps {
  onDataLoaded: (data: RawTemplateData[], fileName: string) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback((file: File | null) => {
    if (!file) {
      setError('No file selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      setIsLoading(false);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      console.error('FileReader error:', reader.error);
      setIsLoading(false);
    };
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result || !(result instanceof ArrayBuffer)) {
          setError('Invalid file data');
          setIsLoading(false);
          return;
        }
        const data = new Uint8Array(result);
        
        const workbook = XLSX.read(data, { type: 'array', FS: ';' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setError('No sheets found in workbook');
          setIsLoading(false);
          return;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          setError('Failed to read worksheet');
          setIsLoading(false);
          return;
        }
        
        const jsonData = (XLSX.utils.sheet_to_json(worksheet) || []) as RawTemplateData[];
        
        if (jsonData.length === 0) {
          setError('The file appears to be empty.');
          setIsLoading(false);
          return;
        }

        // Basic validation of columns
        const requiredColumns = ['WfdName', 'Module Name', 'Object Name', 'Object Type', 'First Used in', 'Found Count'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          setIsLoading(false);
          return;
        }

        onDataLoaded(jsonData, file.name);
        setError(null);
      } catch (err) {
        setError('Failed to parse the file. Please ensure it is a valid Excel or CSV file.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [onDataLoaded]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-3 border-dashed rounded-[2.5rem] p-12 transition-all duration-500
          flex flex-col items-center justify-center text-center group
          ${isDragging 
            ? 'border-gray-500 bg-gray-50/80 dark:bg-gray-800/80 scale-[1.02]' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={isLoading}
        />
        
        <div className={`
          p-6 rounded-3xl mb-6 transition-all duration-500
          ${isDragging ? 'bg-gray-800 dark:bg-gray-700 text-white rotate-12 scale-110' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:scale-110 group-hover:-rotate-6'}
        `}>
          {isLoading ? (
            <Loader2 className="w-12 h-12 animate-spin" />
          ) : isDragging ? (
            <ArrowUpCircle className="w-12 h-12" />
          ) : (
            <Upload className="w-12 h-12" />
          )}
        </div>
        
        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
          {isLoading ? 'Analyzing Data...' : 'Drop your analysis file here'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-10 text-sm leading-relaxed">
          Upload Quadient Inspire exports (.xlsx, .csv) to detect sensitive variables and assess risk.
        </p>
        
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-4 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm group-hover:shadow-md transition-all">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Excel • CSV</span>
          </div>

          <button className="px-10 py-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-2xl shadow-xl shadow-gray-200 transition-all flex items-center gap-3 active:scale-95">
            <Upload className="w-5 h-5" />
            Browse Files
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-8 p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-3xl flex items-start gap-4 text-red-700 dark:text-red-400 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold">Upload Error</p>
            <p className="text-xs font-medium opacity-80">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
