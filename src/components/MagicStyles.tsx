import React, { useState, useCallback } from 'react';
import { Upload, Download, Palette, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenImporter } from './TokenImporter';
import { TokenGrid } from './TokenGrid';
import { AccessibilityChecker } from './AccessibilityChecker';
import { StyleExporter } from './StyleExporter';

export interface ColorToken {
  name: string;
  light: string;
  dark: string;
  category?: string;
}

export interface TokenData {
  colors?: Array<{
    id: string;
    name: string;
    light: string;
    dark: string | null;
    path: string;
  }>;
  text?: Array<{
    id: string;
    name: string;
    path: string;
    color: string;
    [key: string]: any;
  }>;
  // Legacy format support
  [key: string]: any;
}

const MagicStyles = () => {
  const [tokens, setTokens] = useState<ColorToken[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'preview' | 'accessibility' | 'export'>('import');

  const handleTokensImported = useCallback((importedTokens: ColorToken[]) => {
    setTokens(importedTokens);
    setActiveTab('preview');
  }, []);

  const handleTokenUpdate = useCallback((updatedTokens: ColorToken[]) => {
    setTokens(updatedTokens);
  }, []);

  const getTotalTokens = () => tokens.length;
  const getAccessibilityStats = () => {
    // This would be calculated by the AccessibilityChecker component
    return { passed: Math.floor(tokens.length * 0.8), failed: Math.floor(tokens.length * 0.2) };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Magic Styles</h1>
                <p className="text-sm text-text-muted">Style Manager & Accessibility Checker</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-surface-elevated">
                {getTotalTokens()} tokens
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="gap-2"
              >
                {isDarkMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isDarkMode ? 'Light' : 'Dark'} Preview
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-border bg-surface-elevated">
        <div className="container mx-auto px-6">
          <div className="flex gap-1 py-3">
            {[
              { id: 'import', label: 'Import', icon: Upload },
              { id: 'preview', label: 'Preview', icon: Palette },
              { id: 'accessibility', label: 'Accessibility', icon: Eye },
              { id: 'export', label: 'Export', icon: Download }
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(id as any)}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'import' && (
          <TokenImporter onTokensImported={handleTokensImported} />
        )}
        
        {activeTab === 'preview' && (
          <TokenGrid 
            tokens={tokens} 
            isDarkMode={isDarkMode}
            onTokensUpdate={handleTokenUpdate}
          />
        )}
        
        {activeTab === 'accessibility' && (
          <AccessibilityChecker tokens={tokens} isDarkMode={isDarkMode} />
        )}
        
        {activeTab === 'export' && (
          <StyleExporter tokens={tokens} />
        )}
        
        {tokens.length === 0 && activeTab !== 'import' && (
          <Card className="p-12 text-center bg-surface-elevated border-border">
            <Zap className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tokens imported yet</h3>
            <p className="text-text-muted mb-6">
              Import your color tokens to get started with Magic Styles
            </p>
            <Button onClick={() => setActiveTab('import')} className="gap-2">
              <Upload className="w-4 h-4" />
              Import Tokens
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MagicStyles;