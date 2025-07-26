import React, { useCallback, useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ColorToken, TokenData } from './MagicStyles';

interface TokenImporterProps {
  onTokensImported: (tokens: ColorToken[]) => void;
}

export const TokenImporter: React.FC<TokenImporterProps> = ({ onTokensImported }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseTokenData = (data: TokenData): ColorToken[] => {
    const tokens: ColorToken[] = [];
    
    // Handle new structure with colors array
    if (data.colors && Array.isArray(data.colors)) {
      data.colors.forEach((colorToken) => {
        if (colorToken.light && colorToken.dark !== null) {
          // Categorize tokens based on path
          let category = 'Other';
          const path = colorToken.path.toLowerCase();
          if (path.includes('text') || path.includes('icon')) category = 'Text';
          else if (path.includes('bg') || path.includes('background') || path.includes('surface')) category = 'Backgrounds';
          else if (path.includes('border') || path.includes('divider')) category = 'Borders';
          else if (path.includes('brand') || path.includes('primary') || path.includes('secondary') || path.includes('accent')) category = 'Brand';
          else if (path.includes('semantic') || path.includes('success') || path.includes('error') || path.includes('warning') || path.includes('info')) category = 'Semantic';
          else if (path.includes('neutral')) category = 'Neutral';
          
          tokens.push({
            name: colorToken.name,
            light: colorToken.light,
            dark: colorToken.dark || colorToken.light,
            category
          });
        }
      });
    }
    
    // Handle legacy format (fallback)
    Object.entries(data).forEach(([name, values]) => {
      if (values && typeof values === 'object' && values.light && values.dark && name !== 'colors' && name !== 'text') {
        // Categorize tokens based on naming patterns
        let category = 'Other';
        if (name.includes('text') || name.includes('foreground')) category = 'Text';
        else if (name.includes('bg') || name.includes('background') || name.includes('surface')) category = 'Backgrounds';
        else if (name.includes('border') || name.includes('divider')) category = 'Borders';
        else if (name.includes('primary') || name.includes('accent')) category = 'Brand';
        
        tokens.push({
          name,
          light: values.light,
          dark: values.dark,
          category
        });
      }
    });
    
    return tokens;
  };

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const text = await file.text();
      const data = JSON.parse(text) as TokenData;
      const tokens = parseTokenData(data);
      
      if (tokens.length === 0) {
        throw new Error('No valid color tokens found. Please check the JSON format examples below.');
      }
      
      onTokensImported(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
    } finally {
      setIsProcessing(false);
    }
  }, [onTokensImported]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.type === 'application/json' || file.name.endsWith('.json'));
    
    if (jsonFile) {
      handleFile(jsonFile);
    } else {
      setError('Please drop a JSON file');
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const generateSampleTokens = () => {
    const sampleTokens: ColorToken[] = [
      { name: 'primary', light: '#6366f1', dark: '#818cf8', category: 'Brand' },
      { name: 'secondary', light: '#8b5cf6', dark: '#a78bfa', category: 'Brand' },
      { name: 'text-body', light: '#1f2937', dark: '#f9fafb', category: 'Text' },
      { name: 'text-muted', light: '#6b7280', dark: '#9ca3af', category: 'Text' },
      { name: 'bg-surface', light: '#ffffff', dark: '#111827', category: 'Backgrounds' },
      { name: 'bg-elevated', light: '#f9fafb', dark: '#1f2937', category: 'Backgrounds' },
      { name: 'border-default', light: '#e5e7eb', dark: '#374151', category: 'Borders' },
      { name: 'border-focus', light: '#6366f1', dark: '#818cf8', category: 'Borders' }
    ];
    
    onTokensImported(sampleTokens);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Import Color Tokens</h2>
        <p className="text-text-muted">
          Upload a JSON file with your color tokens or generate a sample set to get started
        </p>
      </div>

      {/* File Drop Zone */}
      <Card
        className={`relative p-12 border-2 border-dashed transition-all cursor-pointer
          ${isDragOver 
            ? 'border-primary bg-primary/5 shadow-glow' 
            : 'border-border hover:border-primary/50 bg-surface-elevated'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center">
            {isProcessing ? (
              <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Upload className="w-8 h-8 text-white" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isProcessing ? 'Processing...' : 'Drop your JSON file here'}
          </h3>
          <p className="text-text-muted mb-4">
            or click to browse files
          </p>
          
          <Badge variant="outline" className="bg-background">
            Supports .json files
          </Badge>
        </div>
        
        <input
          id="file-input"
          type="file"
          accept=".json,application/json"
          onChange={handleFileInput}
          className="hidden"
        />
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <h4 className="font-medium text-destructive mb-1">Import Error</h4>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Sample Data Option */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-text-muted mb-4">
          <div className="h-px bg-border flex-1 w-20"></div>
          <span className="text-sm">or</span>
          <div className="h-px bg-border flex-1 w-20"></div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={generateSampleTokens}
          className="gap-2"
          disabled={isProcessing}
        >
          <Sparkles className="w-4 h-4" />
          Generate Sample Tokens
        </Button>
      </div>

      {/* Format Examples */}
      <div className="space-y-4">
        <Card className="p-6 bg-surface-elevated border-border">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-accent mt-1" />
            <div className="w-full">
              <h4 className="font-medium text-foreground mb-2">Framer Token Format (Recommended)</h4>
              <pre className="text-sm bg-background p-3 rounded-lg border border-border overflow-x-auto">
{`{
  "colors": [
    {
      "id": "primary-id",
      "name": "Primary",
      "light": "rgb(168, 255, 214)",
      "dark": "rgb(168, 255, 214)",
      "path": "/Brand/Primary"
    },
    {
      "id": "text-body-id",
      "name": "Body",
      "light": "rgb(0, 0, 0)",
      "dark": "rgb(255, 255, 255)",
      "path": "/Text & Icons/Body"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-surface-elevated border-border">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-accent mt-1" />
            <div className="w-full">
              <h4 className="font-medium text-foreground mb-2">Legacy Format (Also Supported)</h4>
              <pre className="text-sm bg-background p-3 rounded-lg border border-border overflow-x-auto">
{`{
  "primary": {
    "light": "#6366f1",
    "dark": "#818cf8"
  },
  "text-body": {
    "light": "#1f2937",
    "dark": "#f9fafb"
  }
}`}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};