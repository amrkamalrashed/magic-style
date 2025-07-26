import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Download, Palette, Eye, EyeOff, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { framer } from 'framer-plugin';
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
  const [isFramerReady, setIsFramerReady] = useState(false);

  useEffect(() => {
    // Initialize Framer plugin and show UI
    framer.showUI({
      position: 'center',
      width: 400,
      height: 600
    });
    setIsFramerReady(true);

    // Load existing color styles from Framer
    loadFramerStyles();
  }, []);

  const loadFramerStyles = async () => {
    try {
      const colorStyles = await framer.getColorStyles();
      const framerTokens: ColorToken[] = colorStyles.map(style => ({
        name: style.name,
        light: style.light || '#ffffff',
        dark: style.dark || style.light || '#ffffff',
        category: style.name.includes('/') ? style.name.split('/')[0] : 'Colors'
      }));
      
      if (framerTokens.length > 0) {
        setTokens(framerTokens);
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Failed to load Framer styles:', error);
    }
  };

  const handleTokensImported = useCallback((importedTokens: ColorToken[]) => {
    setTokens(importedTokens);
    setActiveTab('preview');
  }, []);

  const handleTokenUpdate = useCallback((updatedTokens: ColorToken[]) => {
    setTokens(updatedTokens);
  }, []);

  const applyStylesToFramer = async () => {
    if (!isFramerReady || tokens.length === 0) return;

    try {
      // Get existing color styles
      const existingStyles = await framer.getColorStyles();
      const existingStyleNames = new Set(existingStyles.map(s => s.name));

      // Create new styles for tokens that don't exist
      for (const token of tokens) {
        const styleName = token.category ? `${token.category}/${token.name}` : token.name;
        
        if (!existingStyleNames.has(styleName)) {
          await framer.createColorStyle({
            name: styleName,
            light: token.light,
            dark: token.dark
          });
        } else {
          // Update existing style
          const existingStyle = existingStyles.find(s => s.name === styleName);
          if (existingStyle) {
            await existingStyle.setAttributes({
              light: token.light,
              dark: token.dark
            });
          }
        }
      }

      framer.notify('✨ Successfully applied styles to Framer project!', { variant: 'success' });
    } catch (error) {
      console.error('Failed to apply styles:', error);
      framer.notify('Failed to apply styles to Framer', { variant: 'error' });
    }
  };

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
                <p className="text-sm text-text-muted">Framer Style Manager</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-surface-elevated">
                {getTotalTokens()} tokens
              </Badge>
              {tokens.length > 0 && (
                <Button
                  onClick={applyStylesToFramer}
                  size="sm"
                  className="gap-2"
                  disabled={!isFramerReady}
                >
                  <Sparkles className="w-4 h-4" />
                  Apply to Framer
                </Button>
              )}
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