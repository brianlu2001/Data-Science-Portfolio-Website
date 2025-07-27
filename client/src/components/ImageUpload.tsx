import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Link, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = "Project Image" }: ImageUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload to server
  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      onChange(data.imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        uploadFile(file);
      } else {
        alert('Please drop an image file.');
      }
    }
  }, []);

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadFile(file);
          break;
        }
      }
    }
  }, []);

  // Clear image
  const clearImage = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-white">{label}</Label>
      
      {/* Upload Method Selection */}
      <RadioGroup value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'url' | 'file')}>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="url" id="url" className="border-gray-400" />
            <Label htmlFor="url" className="text-gray-300 flex items-center gap-2">
              <Link size={16} />
              Image URL
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="file" id="file" className="border-gray-400" />
            <Label htmlFor="file" className="text-gray-300 flex items-center gap-2">
              <Upload size={16} />
              Upload File
            </Label>
          </div>
        </div>
      </RadioGroup>

      {/* URL Input */}
      {uploadMethod === 'url' && (
        <div className="space-y-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="glass-effect border-gray-600 text-white placeholder:text-gray-400"
          />
        </div>
      )}

      {/* File Upload */}
      {uploadMethod === 'file' && (
        <div className="space-y-4">
          <Card
            className={`glass-effect border-2 border-dashed transition-colors cursor-pointer ${
              dragActive 
                ? 'border-royal-400 bg-royal-400/10' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-8 text-center">
              {uploading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal-500 mx-auto"></div>
                  <p className="text-gray-300">Uploading image...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-white font-medium">
                      Drop image here, paste (Ctrl+V), or click to upload
                    </p>
                    <p className="text-sm text-gray-400">
                      Supports JPG, PNG, GIF, WebP
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="glass-effect border-gray-600 text-gray-300 hover:text-white"
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Image Preview */}
      {value && (
        <Card className="glass-effect border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="aspect-video w-32 rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={value}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Im0xNSAxMi0zIDMtMyAtMyIgc3Ryb2tlPSIjNmI3Mjg4IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium mb-2">Current Image</p>
                <p className="text-sm text-gray-400 break-all">{value}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
                className="glass-effect border-gray-600 text-red-400 hover:text-red-300"
              >
                <X size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 