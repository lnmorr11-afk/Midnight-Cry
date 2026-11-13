import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Image URL or upload a file',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-1">
      <label className="block text-xs font-google-sans font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <ImageIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-600"
          />
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-google-sans font-medium cursor-pointer shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  );
};
