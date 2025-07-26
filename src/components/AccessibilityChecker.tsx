import React, { useMemo } from 'react';
import { Eye, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ColorToken } from './MagicStyles';

interface AccessibilityCheckerProps {
  tokens: ColorToken[];
  isDarkMode: boolean;
}

interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  grade: 'excellent' | 'good' | 'poor' | 'fail';
}

// Utility functions for contrast calculation
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const getLuminance = (r: number, g: number, b: number) => {
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
    return { ratio: 0, wcagAA: false, wcagAAA: false, grade: 'fail' };
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  
  const wcagAA = ratio >= 4.5;
  const wcagAAA = ratio >= 7;
  
  let grade: ContrastResult['grade'] = 'fail';
  if (ratio >= 7) grade = 'excellent';
  else if (ratio >= 4.5) grade = 'good';
  else if (ratio >= 3) grade = 'poor';
  
  return { ratio, wcagAA, wcagAAA, grade };
};

const ContrastCard: React.FC<{
  foregroundToken: ColorToken;
  backgroundToken: ColorToken;
  isDarkMode: boolean;
}> = ({ foregroundToken, backgroundToken, isDarkMode }) => {
  const foregroundColor = isDarkMode ? foregroundToken.dark : foregroundToken.light;
  const backgroundColor = isDarkMode ? backgroundToken.dark : backgroundToken.light;
  
  const contrast = getContrastRatio(foregroundColor, backgroundColor);
  
  const getGradeColor = (grade: ContrastResult['grade']) => {
    switch (grade) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-accent';
      case 'poor': return 'text-warning';
      case 'fail': return 'text-destructive';
    }
  };
  
  const getGradeIcon = (grade: ContrastResult['grade']) => {
    switch (grade) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-accent" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'fail': return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <Card className="p-4 bg-surface-elevated border-border">
      <div className="space-y-3">
        {/* Preview */}
        <div 
          className="p-4 rounded-lg border border-border"
          style={{ 
            backgroundColor: backgroundColor,
            color: foregroundColor 
          }}
        >
          <div className="font-medium">Sample Text</div>
          <div className="text-sm opacity-80">The quick brown fox jumps over the lazy dog</div>
        </div>
        
        {/* Token Names */}
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded border border-border" style={{ backgroundColor: foregroundColor }}></div>
            <span className="text-foreground">{foregroundToken.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-border" style={{ backgroundColor: backgroundColor }}></div>
            <span className="text-foreground">{backgroundToken.name}</span>
          </div>
        </div>
        
        {/* Contrast Results */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getGradeIcon(contrast.grade)}
            <span className={`font-medium ${getGradeColor(contrast.grade)}`}>
              {contrast.ratio.toFixed(2)}:1
            </span>
          </div>
          <div className="flex gap-1">
            <Badge 
              variant={contrast.wcagAA ? "default" : "destructive"}
              className="text-xs"
            >
              AA {contrast.wcagAA ? '✓' : '✗'}
            </Badge>
            <Badge 
              variant={contrast.wcagAAA ? "default" : "outline"}
              className="text-xs"
            >
              AAA {contrast.wcagAAA ? '✓' : '✗'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({ tokens, isDarkMode }) => {
  const contrastTests = useMemo(() => {
    const textTokens = tokens.filter(token => 
      token.category === 'Text' || token.name.includes('text') || token.name.includes('foreground')
    );
    const backgroundTokens = tokens.filter(token => 
      token.category === 'Backgrounds' || token.name.includes('bg') || token.name.includes('background') || token.name.includes('surface')
    );
    
    // If no categorized tokens, create some basic tests
    if (textTokens.length === 0 || backgroundTokens.length === 0) {
      return tokens.slice(0, 5).map((token, index) => ({
        foreground: token,
        background: tokens[(index + 1) % tokens.length] || token,
        contrast: getContrastRatio(
          isDarkMode ? token.dark : token.light,
          isDarkMode ? tokens[(index + 1) % tokens.length]?.dark || token.dark : tokens[(index + 1) % tokens.length]?.light || token.light
        )
      }));
    }
    
    const tests: Array<{
      foreground: ColorToken;
      background: ColorToken;
      contrast: ContrastResult;
    }> = [];
    
    textTokens.forEach(textToken => {
      backgroundTokens.forEach(bgToken => {
        const contrast = getContrastRatio(
          isDarkMode ? textToken.dark : textToken.light,
          isDarkMode ? bgToken.dark : bgToken.light
        );
        tests.push({
          foreground: textToken,
          background: bgToken,
          contrast
        });
      });
    });
    
    return tests.sort((a, b) => b.contrast.ratio - a.contrast.ratio);
  }, [tokens, isDarkMode]);

  const stats = useMemo(() => {
    const total = contrastTests.length;
    const passed = contrastTests.filter(test => test.contrast.wcagAA).length;
    const excellent = contrastTests.filter(test => test.contrast.wcagAAA).length;
    const failed = total - passed;
    
    return { total, passed, excellent, failed, passRate: total > 0 ? (passed / total) * 100 : 0 };
  }, [contrastTests]);

  if (tokens.length === 0) {
    return (
      <Card className="p-12 text-center bg-surface-elevated">
        <Eye className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No tokens to check</h3>
        <p className="text-text-muted">Import some color tokens to run accessibility checks</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Accessibility Checker</h2>
        <p className="text-text-muted">
          WCAG contrast ratio analysis for {isDarkMode ? 'dark' : 'light'} mode
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface-elevated">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-text-muted">Total Tests</div>
        </Card>
        <Card className="p-4 bg-surface-elevated">
          <div className="text-2xl font-bold text-success">{stats.passed}</div>
          <div className="text-sm text-text-muted">WCAG AA Passed</div>
        </Card>
        <Card className="p-4 bg-surface-elevated">
          <div className="text-2xl font-bold text-accent">{stats.excellent}</div>
          <div className="text-sm text-text-muted">WCAG AAA Passed</div>
        </Card>
        <Card className="p-4 bg-surface-elevated">
          <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          <div className="text-sm text-text-muted">Failed</div>
        </Card>
      </div>

      {/* Pass Rate */}
      <Card className="p-6 bg-surface-elevated">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Overall Pass Rate</h3>
          <Badge 
            variant={stats.passRate >= 80 ? "default" : stats.passRate >= 60 ? "secondary" : "destructive"}
            className="text-sm"
          >
            {stats.passRate.toFixed(1)}%
          </Badge>
        </div>
        <Progress value={stats.passRate} className="h-3" />
        <div className="flex justify-between text-sm text-text-muted mt-2">
          <span>0%</span>
          <span>100%</span>
        </div>
      </Card>

      {/* Guidelines */}
      <Card className="p-6 bg-surface-elevated border-accent/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent mt-1" />
          <div>
            <h4 className="font-medium text-foreground mb-2">WCAG Guidelines</h4>
            <div className="space-y-2 text-sm text-text-muted">
              <div><strong>AA (4.5:1):</strong> Minimum contrast for normal text</div>
              <div><strong>AAA (7:1):</strong> Enhanced contrast for better accessibility</div>
              <div><strong>Large text:</strong> Requires lower contrast ratios (3:1 AA, 4.5:1 AAA)</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Contrast Tests */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Contrast Test Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contrastTests.map((test, index) => (
            <ContrastCard
              key={`${test.foreground.name}-${test.background.name}-${index}`}
              foregroundToken={test.foreground}
              backgroundToken={test.background}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
};