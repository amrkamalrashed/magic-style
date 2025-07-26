import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, Palette, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { ColorToken } from './MagicStyles';

interface StyleExporterProps {
  tokens: ColorToken[];
}

export const StyleExporter: React.FC<StyleExporterProps> = ({ tokens }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate different export formats
  const generateJSON = () => {
    const tokenData: Record<string, { light: string; dark: string }> = {};
    tokens.forEach(token => {
      tokenData[token.name] = {
        light: token.light,
        dark: token.dark
      };
    });
    return JSON.stringify(tokenData, null, 2);
  };

  const generateCSS = () => {
    let css = `:root {\n  /* Light mode tokens */\n`;
    tokens.forEach(token => {
      css += `  --${token.name}: ${token.light};\n`;
    });
    css += `}\n\n.dark {\n  /* Dark mode tokens */\n`;
    tokens.forEach(token => {
      css += `  --${token.name}: ${token.dark};\n`;
    });
    css += `}\n`;
    return css;
  };

  const generateTailwind = () => {
    const config = {
      theme: {
        extend: {
          colors: {} as Record<string, string>
        }
      }
    };
    
    tokens.forEach(token => {
      config.theme.extend.colors[token.name] = `hsl(var(--${token.name}))`;
    });
    
    return `// Add to your tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(config.theme.extend.colors, null, 6)}\n    }\n  }\n}`;
  };

  const generateFramerStyles = () => {
    let framerCode = `// Framer Style Definitions\n// Copy these into your Framer project\n\n`;
    
    tokens.forEach(token => {
      framerCode += `// ${token.name}\n`;
      framerCode += `export const ${token.name.replace(/-/g, '_')}Light = "${token.light}";\n`;
      framerCode += `export const ${token.name.replace(/-/g, '_')}Dark = "${token.dark}";\n\n`;
    });
    
    framerCode += `// Utility function to get color based on theme\n`;
    framerCode += `export const getTokenColor = (tokenName: string, isDark: boolean = false) => {\n`;
    framerCode += `  const tokens = {\n`;
    
    tokens.forEach(token => {
      framerCode += `    "${token.name}": { light: "${token.light}", dark: "${token.dark}" },\n`;
    });
    
    framerCode += `  };\n  return tokens[tokenName]?.[isDark ? 'dark' : 'light'] || '#000000';\n};\n`;
    
    return framerCode;
  };

  const generateSCSS = () => {
    let scss = `// SCSS/Sass Variables\n\n// Light mode\n`;
    tokens.forEach(token => {
      scss += `$${token.name}-light: ${token.light};\n`;
    });
    scss += `\n// Dark mode\n`;
    tokens.forEach(token => {
      scss += `$${token.name}-dark: ${token.dark};\n`;
    });
    
    scss += `\n// Theme map\n$color-tokens: (\n`;
    tokens.forEach(token => {
      scss += `  "${token.name}": (\n    light: ${token.light},\n    dark: ${token.dark}\n  ),\n`;
    });
    scss += `);\n\n// Function to get token\n@function get-token($name, $mode: 'light') {\n  @return map-get(map-get($color-tokens, $name), $mode);\n}\n`;
    
    return scss;
  };

  const exportFormats = [
    {
      id: 'json',
      label: 'JSON',
      icon: FileCode,
      description: 'Original token format',
      content: generateJSON(),
      filename: 'color-tokens.json',
      mimeType: 'application/json'
    },
    {
      id: 'css',
      label: 'CSS Variables',
      icon: Palette,
      description: 'CSS custom properties',
      content: generateCSS(),
      filename: 'tokens.css',
      mimeType: 'text/css'
    },
    {
      id: 'tailwind',
      label: 'Tailwind Config',
      icon: Zap,
      description: 'Tailwind CSS configuration',
      content: generateTailwind(),
      filename: 'tailwind-tokens.js',
      mimeType: 'text/javascript'
    },
    {
      id: 'framer',
      label: 'Framer Styles',
      icon: Palette,
      description: 'Framer style definitions',
      content: generateFramerStyles(),
      filename: 'framer-tokens.ts',
      mimeType: 'text/typescript'
    },
    {
      id: 'scss',
      label: 'SCSS Variables',
      icon: FileCode,
      description: 'Sass/SCSS variables',
      content: generateSCSS(),
      filename: 'tokens.scss',
      mimeType: 'text/scss'
    }
  ];

  if (tokens.length === 0) {
    return (
      <Card className="p-12 text-center bg-surface-elevated">
        <Download className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No tokens to export</h3>
        <p className="text-text-muted">Import some color tokens to export them in various formats</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Export Styles</h2>
        <p className="text-text-muted">
          Export your {tokens.length} color tokens in various formats for your project
        </p>
      </div>

      {/* Export Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface-elevated text-center">
          <div className="text-2xl font-bold text-foreground">{tokens.length}</div>
          <div className="text-sm text-text-muted">Total Tokens</div>
        </Card>
        <Card className="p-4 bg-surface-elevated text-center">
          <div className="text-2xl font-bold text-accent">{new Set(tokens.map(t => t.category)).size}</div>
          <div className="text-sm text-text-muted">Categories</div>
        </Card>
        <Card className="p-4 bg-surface-elevated text-center">
          <div className="text-2xl font-bold text-primary">{exportFormats.length}</div>
          <div className="text-sm text-text-muted">Export Formats</div>
        </Card>
        <Card className="p-4 bg-surface-elevated text-center">
          <div className="text-2xl font-bold text-success">100%</div>
          <div className="text-sm text-text-muted">Ready to Export</div>
        </Card>
      </div>

      {/* Export Formats */}
      <Tabs defaultValue="json" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-surface-elevated">
          {exportFormats.map(format => (
            <TabsTrigger key={format.id} value={format.id} className="flex items-center gap-1">
              <format.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{format.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {exportFormats.map(format => (
          <TabsContent key={format.id} value={format.id} className="space-y-4">
            <Card className="p-4 bg-surface-elevated">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <format.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{format.label}</h3>
                    <p className="text-sm text-text-muted">{format.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(format.content, format.id)}
                    className="gap-2"
                  >
                    {copied === format.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied === format.id ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadFile(format.content, format.filename, format.mimeType)}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>

              <Textarea
                value={format.content}
                readOnly
                className="font-mono text-sm bg-background border-border min-h-[400px] resize-none"
              />
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Actions */}
      <Card className="p-6 bg-surface-elevated border-accent/20">
        <h3 className="font-semibold text-foreground mb-4">Quick Export Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              const jsonContent = generateJSON();
              downloadFile(jsonContent, 'magic-styles-tokens.json', 'application/json');
            }}
            className="gap-2 justify-start h-auto p-4"
          >
            <FileCode className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Download All as JSON</div>
              <div className="text-sm text-text-muted">Backup your complete token set</div>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const allFormats = exportFormats.map(f => `/* ${f.label} */\n${f.content}`).join('\n\n---\n\n');
              copyToClipboard(allFormats, 'all');
            }}
            className="gap-2 justify-start h-auto p-4"
          >
            <Copy className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Copy All Formats</div>
              <div className="text-sm text-text-muted">All export formats to clipboard</div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};