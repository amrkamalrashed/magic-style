import React, { useState, useCallback, useEffect } from 'react';
import { Scan, Download, Palette, Eye, EyeOff, Zap, Sparkles, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectScanner } from './ProjectScanner';
import { StyleGenerator } from './StyleGenerator';
import DesignSystemEditor from './DesignSystemEditor';
import { StyleExporter } from './StyleExporter';

// Declare Framer API types for TypeScript
declare global {
  interface Window {
    framer?: any;
  }
}

// Simplified Framer API detection for UI component
const getFramerAPI = () => {
  // Check for direct Framer API
  if ((window as any).framer) {
    return (window as any).framer;
  }
  
  // Check parent window
  try {
    if (window.parent && window.parent !== window && (window.parent as any).framer) {
      return (window.parent as any).framer;
    }
  } catch (error) {
    // Cross-origin access blocked (expected in development)
  }
  
  // Check top window
  try {
    if (window.top && window.top !== window && (window.top as any).framer) {
      return (window.top as any).framer;
    }
  } catch (error) {
    // Cross-origin access blocked (expected in development)
  }
  
  return null;
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

export interface TextStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  category: 'heading' | 'body' | 'caption';
}

const MagicStyles = () => {
  const [tokens, setTokens] = useState<ColorToken[]>([]);
  const [textStyles, setTextStyles] = useState<TextStyle[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'scanner' | 'generator' | 'edit'>('scanner');
  const [isFramerReady, setIsFramerReady] = useState(false);
  const [showInitialChoice, setShowInitialChoice] = useState(true);

  useEffect(() => {
    console.log('🚀 MagicStyles UI initializing...');
    
    // Listen for plugin ready message
    const handlePluginReady = (event: MessageEvent) => {
      if (event.data.type === 'PLUGIN_READY') {
        console.log('✅ Plugin ready message received');
        setIsFramerReady(true);
        
        // Load existing styles
        const framerAPI = getFramerAPI();
        if (framerAPI) {
          loadFramerStyles(framerAPI);
        }
      }
    };
    
    window.addEventListener('message', handlePluginReady);
    
    // Also check if Framer API is already available (for development)
    const framerAPI = getFramerAPI();
    if (framerAPI) {
      console.log('✅ Framer API already available');
      setIsFramerReady(true);
      loadFramerStyles(framerAPI);
    }
    
    return () => {
      window.removeEventListener('message', handlePluginReady);
    };
  }, []);

  const loadFramerStyles = async (framerAPI: any = null) => {
    const api = framerAPI || getFramerAPI();
    
    if (!api) {
      console.log('⚠️ No Framer API available');
      return;
    }
    
    try {
      console.log('📥 Loading Framer styles...');
      const colorStyles = await api.getColorStyles();
      console.log('🎨 Loaded color styles:', colorStyles);
      
      const framerTokens: ColorToken[] = colorStyles.map((style: any) => ({
        name: style.name,
        light: style.light || '#ffffff',
        dark: style.dark || style.light || '#ffffff',
        category: style.name.includes('/') ? style.name.split('/')[0] : 'Colors'
      }));
      
      if (framerTokens.length > 0) {
        console.log(`✅ Loaded ${framerTokens.length} tokens`);
        setTokens(framerTokens);
        setActiveTab('edit');
        setShowInitialChoice(false);
      } else {
        console.log('ℹ️ No existing color styles found');
      }
    } catch (error) {
      console.error('❌ Failed to load Framer styles:', error);
    }
  };

  const sortTokens = (tokensToSort: ColorToken[]) => {
    const categoryPriority = { 'Brand': 1, 'Text': 2, 'Background': 3, 'Semantic': 4, 'Neutral': 5 };
    return tokensToSort.sort((a, b) => {
      const priorityA = categoryPriority[a.category as keyof typeof categoryPriority] || 99;
      const priorityB = categoryPriority[b.category as keyof typeof categoryPriority] || 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.name.localeCompare(b.name);
    });
  };

  const handleStylesScanned = useCallback((scannedTokens: ColorToken[]) => {
    setTokens(sortTokens(scannedTokens));
    setShowInitialChoice(false);
    setActiveTab('edit');
  }, []);

  const handleStylesGenerated = useCallback((generatedTokens: ColorToken[]) => {
    setTokens(sortTokens(generatedTokens));
    setShowInitialChoice(false);
    setActiveTab('edit');
  }, []);

  const handleTextStylesGenerated = useCallback((generatedTextStyles: TextStyle[]) => {
    setTextStyles(generatedTextStyles);
    setShowInitialChoice(false);
    setActiveTab('edit');
  }, []);

  useEffect(() => {
    const handleNavigateToEdit = () => {
      setActiveTab('edit');
    };

    const handleGenerateTextSystem = () => {
      setActiveTab('generator');
    };

    window.addEventListener('navigate-to-edit', handleNavigateToEdit);
    window.addEventListener('generate-text-system', handleGenerateTextSystem);

    return () => {
      window.removeEventListener('navigate-to-edit', handleNavigateToEdit);
      window.removeEventListener('generate-text-system', handleGenerateTextSystem);
    };
  }, []);

  const handleTokenUpdate = useCallback((updatedTokens: ColorToken[]) => {
    setTokens(sortTokens(updatedTokens));
  }, []);

  const handleTextStylesUpdate = useCallback((updatedTextStyles: TextStyle[]) => {
    setTextStyles(updatedTextStyles);
  }, []);

  const applyStylesToFramer = async () => {
    if (!isFramerReady || tokens.length === 0) {
      console.log('⚠️ Cannot apply styles: not ready or no tokens');
      return;
    }

    const framerAPI = getFramerAPI();
    if (!framerAPI) {
      console.error('❌ No Framer API available');
      return;
    }

    console.log('🎨 Applying styles to Framer...', { tokenCount: tokens.length });

    try {
      const existingStyles = await framerAPI.getColorStyles();
      const existingStyleNames = new Set(existingStyles.map((s: any) => s.name));
      console.log('📋 Existing styles:', existingStyleNames);

      let createdCount = 0;
      let updatedCount = 0;

      for (const token of tokens) {
        const styleName = token.category ? `${token.category}/${token.name}` : token.name;
        
        if (!existingStyleNames.has(styleName)) {
          console.log('➕ Creating new style:', styleName);
          await framerAPI.createColorStyle({
            name: styleName,
            light: token.light,
            dark: token.dark
          });
          createdCount++;
        } else {
          console.log('🔄 Updating existing style:', styleName);
          const existingStyle = existingStyles.find((s: any) => s.name === styleName);
          if (existingStyle && existingStyle.setAttributes) {
            await existingStyle.setAttributes({
              light: token.light,
              dark: token.dark
            });
            updatedCount++;
          }
        }
      }

      const message = `✨ Applied ${tokens.length} styles (${createdCount} new, ${updatedCount} updated)`;
      console.log('✅', message);
      framerAPI.notify(message, { variant: 'success' });
    } catch (error) {
      console.error('❌ Failed to apply styles:', error);
      framerAPI.notify('Failed to apply styles to Framer', { variant: 'error' });
    }
  };

  const getTotalTokens = () => tokens.length;
  const getAccessibilityStats = () => {
    return { passed: Math.floor(tokens.length * 0.8), failed: Math.floor(tokens.length * 0.2) };
  };

  // Show "not in Framer" message if not in Framer environment
  if (!isFramerReady && !getFramerAPI()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center bg-surface-elevated">
          <div className="w-16 h-16 rounded-full bg-warning/10 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Not in Framer Environment</h3>
          <p className="text-text-muted">
            This plugin only works within Framer. Please run it as a Framer plugin to access design system management features.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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

      {!showInitialChoice && (
        <nav className="border-b border-border bg-surface-elevated">
          <div className="container mx-auto px-6">
            <div className="flex gap-1 py-3">
              {[
                { id: 'scanner', label: 'Scanner', icon: Scan },
                { id: 'generator', label: 'Generator', icon: Plus },
                ...(tokens.length > 0 || textStyles.length > 0 ? [{ id: 'edit', label: 'Edit', icon: Eye }] : [])
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
                   <h3 className="text-xl font-semibold text-foreground">Scan Styles</h3>
                   <p className="text-text-muted">
                     Analyze your existing Framer project to discover styles, identify improvements, and apply enhancements like accessibility fixes and dark mode generation.
                   </p>
                   <Button className="w-full gap-2">
                     <Scan className="w-4 h-4" />
                     Scan Existing Styles
                   </Button>
                </div>
              </Card>

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
                   <h3 className="text-xl font-semibold text-foreground">Generate Styles</h3>
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
              <StyleGenerator 
                onStylesGenerated={handleStylesGenerated} 
                onTextStylesGenerated={handleTextStylesGenerated} 
              />
            )}
            
            {activeTab === 'edit' && (
              <DesignSystemEditor 
                tokens={tokens} 
                textStyles={textStyles}
                isDarkMode={isDarkMode}
                onTokensUpdate={handleTokenUpdate}
                onTextStylesUpdate={handleTextStylesUpdate}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
                onApplyToFramer={applyStylesToFramer}
              />
            )}
            
            {tokens.length === 0 && activeTab === 'edit' && (
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
