/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { RawTemplateData } from '../lib/analyzer';

interface FileUploadProps {
  onDataLoaded: (data: RawTemplateData[]) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  if (typeof onDataLoaded !== 'function') {
    console.error('FileUpload: onDataLoaded callback is not a function');
    return null;
  }
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File | null) => {
    if (!file) {
      setError('No file selected');
      return;
    }

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      console.error('FileReader error:', reader.error);
    };
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result || !(result instanceof ArrayBuffer)) {
          setError('Invalid file data');
          return;
        }
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setError('No sheets found in workbook');
          return;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setError('Invalid sheet name');
          return;
        }
        
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) {
          setError('Failed to read worksheet');
          return;
        }
        
        const jsonData = (XLSX.utils.sheet_to_json(worksheet) || []) as RawTemplateData[];
        
        if (jsonData.length === 0) {
          setError('The file appears to be empty.');
          return;
        }

        // Basic validation of columns
        const requiredColumns = ['WfdName', 'Module Name', 'Object Name', 'Object Type', 'First Used in', 'Found Count'];
        const firstRow = jsonData[0];
        const missingColumns = requiredColumns.filter(col => !(col in firstRow));

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        onDataLoaded(jsonData);
        setError(null);
      } catch (err) {
        setError('Failed to parse the file. Please ensure it is a valid Excel or CSV file.');
        console.error(err);
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
    <div className="w-full max-w-2xl mx-auto p-8">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300
          flex flex-col items-center justify-center text-center cursor-pointer
          ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
        `}
      >
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          <Upload className="w-8 h-8 text-indigo-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Upload Template Analysis Data
        </h3>
        <p className="text-gray-500 mb-6">
          Drag and drop your Excel or CSV file here, or click to browse
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>.xlsx</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>.csv</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wider">
          Expected Format
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-blue-800">
            <thead>
              <tr className="border-b border-blue-200">
                <th className="text-left py-2 px-2">WfdName</th>
                <th className="text-left py-2 px-2">Module Name</th>
                <th className="text-left py-2 px-2">Object Name</th>
                <th className="text-left py-2 px-2">Object Type</th>
                <th className="text-left py-2 px-2">First Used in</th>
                <th className="text-left py-2 px-2">Found Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-2">vcs://.../template.wfd</td>
                <td className="py-2 px-2">DocumentLayout</td>
                <td className="py-2 px-2">Data.EmailTo</td>
                <td className="py-2 px-2">Variable</td>
                <td className="py-2 px-2">Pages</td>
                <td className="py-2 px-2">1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
