import React, { useState, useCallback, useEffect } from 'react';
import { Scan, Download, Palette, Eye, EyeOff, Zap, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectScanner } from './ProjectScanner';
import { StyleGenerator } from './StyleGenerator';
import { TokenGrid } from './TokenGrid';
import { AccessibilityChecker } from './AccessibilityChecker';
import { StyleExporter } from './StyleExporter';

// Mock Framer API for development/testing
const mockFramer = {
  showUI: (options: any) => console.log('Mock: showUI called', options),
  getColorStyles: () => Promise.resolve([]),
  createColorStyle: (style: any) => Promise.resolve(console.log('Mock: createColorStyle', style)),
  notify: (message: string, options?: any) => console.log('Mock notification:', message, options)
};

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
  const [activeTab, setActiveTab] = useState<'scanner' | 'generator' | 'preview' | 'accessibility' | 'export'>('scanner');
  const [isFramerReady, setIsFramerReady] = useState(false);
  const [showInitialChoice, setShowInitialChoice] = useState(true);

  useEffect(() => {
    // Check if running in Framer environment
    const isFramerEnvironment = typeof window !== 'undefined' && (window as any).framer;
    
    if (isFramerEnvironment) {
      // Real Framer plugin initialization
      const framer = (window as any).framer;
      framer.showUI({
        position: 'center',
        width: 400,
        height: 600
      });
      loadFramerStyles(framer);
    } else {
      // Development mode - use mock
      mockFramer.showUI({
        position: 'center',
        width: 400,
        height: 600
      });
    }
    
    setIsFramerReady(true);
  }, []);

  const loadFramerStyles = async (framerAPI: any = mockFramer) => {
    try {
      const colorStyles = await framerAPI.getColorStyles();
      const framerTokens: ColorToken[] = colorStyles.map((style: any) => ({
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

  const handleStylesScanned = useCallback((scannedTokens: ColorToken[]) => {
    setTokens(scannedTokens);
    setShowInitialChoice(false);
    setActiveTab('preview');
  }, []);

  const handleStylesGenerated = useCallback((generatedTokens: ColorToken[]) => {
    setTokens(generatedTokens);
    setShowInitialChoice(false);
    setActiveTab('preview');
  }, []);

  const handleTokenUpdate = useCallback((updatedTokens: ColorToken[]) => {
    setTokens(updatedTokens);
  }, []);

  const applyStylesToFramer = async () => {
    if (!isFramerReady || tokens.length === 0) return;

    // Check if running in Framer environment
    const isFramerEnvironment = typeof window !== 'undefined' && (window as any).framer;
    const framerAPI = isFramerEnvironment ? (window as any).framer : mockFramer;

    try {
      // Get existing color styles
      const existingStyles = await framerAPI.getColorStyles();
      const existingStyleNames = new Set(existingStyles.map((s: any) => s.name));

      // Create new styles for tokens that don't exist
      for (const token of tokens) {
        const styleName = token.category ? `${token.category}/${token.name}` : token.name;
        
        if (!existingStyleNames.has(styleName)) {
          await framerAPI.createColorStyle({
            name: styleName,
            light: token.light,
            dark: token.dark
          });
        } else {
          // Update existing style
          const existingStyle = existingStyles.find((s: any) => s.name === styleName);
          if (existingStyle && existingStyle.setAttributes) {
            await existingStyle.setAttributes({
              light: token.light,
              dark: token.dark
            });
          }
        }
      }

      framerAPI.notify('✨ Successfully applied styles to Framer project!', { variant: 'success' });
    } catch (error) {
      console.error('Failed to apply styles:', error);
      framerAPI.notify('Failed to apply styles to Framer', { variant: 'error' });
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
      {!showInitialChoice && (
        <nav className="border-b border-border bg-surface-elevated">
          <div className="container mx-auto px-6">
            <div className="flex gap-1 py-3">
              {[
                { id: 'scanner', label: 'Scanner', icon: Scan },
                { id: 'generator', label: 'Generator', icon: Plus },
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
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {showInitialChoice ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">Magic Styles</h2>
              <p className="text-text-muted text-lg">
                Choose how you want to start building your design system
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Scan Project Option */}
              <Card 
                className="p-8 cursor-pointer transition-all hover:shadow-glow hover:border-primary/50 bg-surface-elevated"
                onClick={() => {
                  setShowInitialChoice(false);
                  setActiveTab('scanner');
                }}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary mx-auto flex items-center justify-center">
                    <Scan className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Scan Project</h3>
                  <p className="text-text-muted">
                    Analyze your existing Framer project to discover styles, identify improvements, and apply enhancements like accessibility fixes and dark mode generation.
                  </p>
                  <Button className="w-full gap-2">
                    <Scan className="w-4 h-4" />
                    Scan Existing Styles
                  </Button>
                </div>
              </Card>

              {/* Generate New System Option */}
              <Card 
                className="p-8 cursor-pointer transition-all hover:shadow-glow hover:border-primary/50 bg-surface-elevated"
                onClick={() => {
                  setShowInitialChoice(false);
                  setActiveTab('generator');
                }}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-accent mx-auto flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Generate New System</h3>
                  <p className="text-text-muted">
                    Start from scratch with just your primary and secondary colors. Generate a complete design system with semantic tokens, states, and accessibility compliance.
                  </p>
                  <Button variant="outline" className="w-full gap-2">
                    <Plus className="w-4 h-4" />
                    Create New System
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'scanner' && (
              <ProjectScanner 
                onStylesScanned={handleStylesScanned} 
                isFramerReady={isFramerReady}
              />
            )}
            
            {activeTab === 'generator' && (
              <StyleGenerator onStylesGenerated={handleStylesGenerated} />
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
            
            {tokens.length === 0 && (activeTab === 'preview' || activeTab === 'accessibility' || activeTab === 'export') && (
              <Card className="p-12 text-center bg-surface-elevated border-border">
                <Zap className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No styles yet</h3>
                <p className="text-text-muted mb-6">
                  Scan your project or generate a new system to get started
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setActiveTab('scanner')} className="gap-2">
                    <Scan className="w-4 h-4" />
                    Scan Project
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('generator')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Generate System
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MagicStyles;