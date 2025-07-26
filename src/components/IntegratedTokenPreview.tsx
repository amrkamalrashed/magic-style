import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Search, Filter, Palette, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import ViewToggle, { ViewMode } from './ViewToggle';
import AccessibilityIndicator from './AccessibilityIndicator';
import QuickFix, { fixColorContrast } from './QuickFix';

interface ColorToken {
  name: string;
  light: string;
  dark: string;
  category?: string;
}

interface IntegratedTokenPreviewProps {
  tokens: ColorToken[];
  isDarkMode: boolean;
  onTokensUpdate: (tokens: ColorToken[]) => void;
  onToggleDarkMode: () => void;
}

interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  grade: 'excellent' | 'good' | 'poor' | 'fail';
}

export const IntegratedTokenPreview: React.FC<IntegratedTokenPreviewProps> = ({
  tokens,
  isDarkMode,
  onTokensUpdate,
  onToggleDarkMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [showAccessibilityDetails, setShowAccessibilityDetails] = useState(false);
  const { toast } = useToast();

  // Utility functions for contrast calculation
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const getContrastRatio = (color1: string, color2: string): ContrastResult => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) {
      return { ratio: 1, wcagAA: false, wcagAAA: false, grade: 'fail' };
    }
    
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    const ratio = (brightest + 0.05) / (darkest + 0.05);
    const wcagAA = ratio >= 4.5;
    const wcagAAA = ratio >= 7;
    
    let grade: ContrastResult['grade'];
    if (ratio >= 7) grade = 'excellent';
    else if (ratio >= 4.5) grade = 'good';
    else if (ratio >= 3) grade = 'poor';
    else grade = 'fail';
    
    return { ratio, wcagAA, wcagAAA, grade };
  };

  // Calculate accessibility results
  const accessibilityResults = useMemo(() => {
    const textTokens = tokens.filter(token => 
      token.category?.toLowerCase().includes('text') || 
      token.name.toLowerCase().includes('text') ||
      token.name.toLowerCase().includes('foreground')
    );
    
    const backgroundTokens = tokens.filter(token => 
      token.category?.toLowerCase().includes('background') || 
      token.name.toLowerCase().includes('background') ||
      token.name.toLowerCase().includes('surface')
    );

    const tests: Array<{
      textToken: ColorToken;
      backgroundToken: ColorToken;
      result: ContrastResult;
    }> = [];

    textTokens.forEach(textToken => {
      backgroundTokens.forEach(backgroundToken => {
        const textColor = isDarkMode ? textToken.dark : textToken.light;
        const bgColor = isDarkMode ? backgroundToken.dark : backgroundToken.light;
        const result = getContrastRatio(textColor, bgColor);
        
        tests.push({
          textToken,
          backgroundToken,
          result
        });
      });
    });

    const failedTests = tests.filter(test => test.result.grade === 'fail' || test.result.grade === 'poor');
    
    return { tests, failedTests, failedCount: failedTests.length };
  }, [tokens, isDarkMode]);

  // Filter tokens
  const categories = useMemo(() => {
    const cats = Array.from(new Set(tokens.map(token => token.category).filter(Boolean)));
    return cats.sort();
  }, [tokens]);

  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || token.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tokens, searchTerm, selectedCategory]);

  // Handle token updates
  const handleTokenUpdate = (tokenName: string, field: 'light' | 'dark', value: string) => {
    const updatedTokens = tokens.map(token =>
      token.name === tokenName ? { ...token, [field]: value } : token
    );
    onTokensUpdate(updatedTokens);
  };

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    toast({
      description: `Copied ${color} to clipboard`,
      duration: 2000,
    });
  };

  const handleFixAllIssues = () => {
    const updatedTokens = tokens.map(token => {
      const needsFix = accessibilityResults.failedTests.some(test => 
        test.textToken.name === token.name || test.backgroundToken.name === token.name
      );
      
      if (needsFix && token.name.toLowerCase().includes('text')) {
        // Find a background token to test against
        const bgToken = tokens.find(t => t.name.toLowerCase().includes('background'));
        if (bgToken) {
          const fixedLight = fixColorContrast(token.light, bgToken.light);
          const fixedDark = fixColorContrast(token.dark, bgToken.dark);
          return { ...token, light: fixedLight, dark: fixedDark };
        }
      }
      
      return token;
    });
    
    onTokensUpdate(updatedTokens);
    toast({
      title: "Accessibility Fixed",
      description: "Color contrast issues have been automatically resolved",
    });
  };

  const handleFixSingleToken = (tokenName: string) => {
    const token = tokens.find(t => t.name === tokenName);
    if (!token) return;

    const bgToken = tokens.find(t => t.name.toLowerCase().includes('background'));
    if (bgToken) {
      const fixedLight = fixColorContrast(token.light, bgToken.light);
      const fixedDark = fixColorContrast(token.dark, bgToken.dark);
      
      const updatedTokens = tokens.map(t =>
        t.name === tokenName ? { ...t, light: fixedLight, dark: fixedDark } : t
      );
      
      onTokensUpdate(updatedTokens);
      toast({
        description: `Fixed accessibility for ${token.name}`,
      });
    }
  };

  // Render token card based on view mode
  const renderTokenCard = (token: ColorToken) => {
    const currentColor = isDarkMode ? token.dark : token.light;
    const isEditing = editingToken === token.name;
    
    // Get accessibility info for this token
    const tokenAccessibility = accessibilityResults.tests.find(test => 
      test.textToken.name === token.name || test.backgroundToken.name === token.name
    );

    const cardClass = cn(
      "group transition-all duration-200 hover:shadow-medium",
      viewMode === 'list' && "flex-row",
      viewMode === 'compact' && "p-3"
    );

    const contentClass = cn(
      "space-y-3",
      viewMode === 'list' && "flex items-center justify-between w-full space-y-0 space-x-4",
      viewMode === 'compact' && "space-y-2"
    );

    return (
      <Card key={token.name} className={cardClass}>
        <CardContent className={cn("p-4", viewMode === 'compact' && "p-3")}>
          <div className={contentClass}>
            {/* Color Preview */}
            <div className={cn(
              "space-y-2",
              viewMode === 'list' && "space-y-0 space-x-2 flex items-center"
            )}>
              <div 
                className={cn(
                  "rounded-lg border-2 border-border/20 cursor-pointer transition-all hover:scale-105",
                  viewMode === 'compact' ? "h-8 w-full" : "h-12 w-full",
                  viewMode === 'list' && "h-8 w-16 flex-shrink-0"
                )}
                style={{ backgroundColor: currentColor }}
                onClick={() => handleCopyColor(currentColor)}
                title={`Click to copy ${currentColor}`}
              />
              
              <div className={cn(
                "space-y-1",
                viewMode === 'list' && "space-y-0"
              )}>
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "font-medium text-foreground",
                    viewMode === 'compact' && "text-sm"
                  )}>
                    {token.name}
                  </h4>
                  {token.category && (
                    <Badge variant="secondary" className="text-xs">
                      {token.category}
                    </Badge>
                  )}
                </div>
                
                {tokenAccessibility && (
                  <AccessibilityIndicator
                    ratio={tokenAccessibility.result.ratio}
                    wcagAA={tokenAccessibility.result.wcagAA}
                    wcagAAA={tokenAccessibility.result.wcagAAA}
                    grade={tokenAccessibility.result.grade}
                    onFix={() => handleFixSingleToken(token.name)}
                    size={viewMode === 'compact' ? 'sm' : 'md'}
                  />
                )}
              </div>
            </div>

            {/* Color Values */}
            <div className={cn(
              "space-y-2",
              viewMode === 'list' && "space-y-0 space-x-2 flex items-center"
            )}>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Light</label>
                  <div className="flex items-center space-x-1">
                    {isEditing ? (
                      <Input
                        value={token.light}
                        onChange={(e) => handleTokenUpdate(token.name, 'light', e.target.value)}
                        className="h-7 text-xs"
                        pattern="^#[a-fA-F0-9]{6}$"
                      />
                    ) : (
                      <code 
                        className="flex-1 px-2 py-1 bg-muted rounded text-xs cursor-pointer hover:bg-muted/80"
                        onClick={() => handleCopyColor(token.light)}
                      >
                        {token.light}
                      </code>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyColor(token.light)}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Dark</label>
                  <div className="flex items-center space-x-1">
                    {isEditing ? (
                      <Input
                        value={token.dark}
                        onChange={(e) => handleTokenUpdate(token.name, 'dark', e.target.value)}
                        className="h-7 text-xs"
                        pattern="^#[a-fA-F0-9]{6}$"
                      />
                    ) : (
                      <code 
                        className="flex-1 px-2 py-1 bg-muted rounded text-xs cursor-pointer hover:bg-muted/80"
                        onClick={() => handleCopyColor(token.dark)}
                      >
                        {token.dark}
                      </code>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyColor(token.dark)}
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {viewMode !== 'list' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingToken(isEditing ? null : token.name)}
                  className="w-full h-7 text-xs"
                >
                  {isEditing ? 'Save' : 'Edit'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (tokens.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Tokens Available</h3>
          <p className="text-muted-foreground mb-4">
            Generate a new style system or scan an existing project to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Style Preview</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDarkMode}
            className="flex items-center gap-2"
          >
            {isDarkMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>

        {/* Accessibility Summary */}
        <QuickFix 
          failedCount={accessibilityResults.failedCount}
          onFixAll={handleFixAllIssues}
          onShowDetails={() => setShowAccessibilityDetails(!showAccessibilityDetails)}
        />

        {/* Filters and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                <Button
                  variant={selectedCategory === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <ViewToggle 
            currentView={viewMode}
            onViewChange={setViewMode}
          />
        </div>
      </div>

      {/* Accessibility Details */}
      {showAccessibilityDetails && accessibilityResults.tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accessibility Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accessibilityResults.tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: isDarkMode ? test.textToken.dark : test.textToken.light }}
                      />
                      <span className="text-sm font-medium">{test.textToken.name}</span>
                    </div>
                    <span className="text-muted-foreground">on</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: isDarkMode ? test.backgroundToken.dark : test.backgroundToken.light }}
                      />
                      <span className="text-sm font-medium">{test.backgroundToken.name}</span>
                    </div>
                  </div>
                  
                  <AccessibilityIndicator
                    ratio={test.result.ratio}
                    wcagAA={test.result.wcagAA}
                    wcagAAA={test.result.wcagAAA}
                    grade={test.result.grade}
                    onFix={() => handleFixSingleToken(test.textToken.name)}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Grid */}
      <div className={cn(
        "gap-4",
        viewMode === 'grid' && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        viewMode === 'compact' && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5",
        viewMode === 'list' && "space-y-2"
      )}>
        {filteredTokens.map(renderTokenCard)}
      </div>

      {filteredTokens.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">
              No tokens match your current filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntegratedTokenPreview;