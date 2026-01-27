import { readFileSync } from 'fs';

export type Framework = 'react' | 'svelte' | 'vue' | 'vanilla';

export interface FrameworkConfig {
  loaders: Record<string, string>;
  plugins?: () => Promise<any[]>;
  mainFields?: string[];
  external?: string[];
}

export const FRAMEWORKS: Record<Framework, FrameworkConfig> = {
  react: {
    loaders: {
      '.js': 'jsx',
      '.ts': 'tsx',
      '.tsx': 'tsx',
      '.jsx': 'jsx',
    },
    plugins: undefined,
    mainFields: ['browser', 'module', 'main'],
  },
  svelte: {
    loaders: {
      '.js': 'js',
      '.ts': 'ts',
    },
    plugins: async () => {
      try {
        // Dynamic import to avoid errors if esbuild-svelte is not installed
        const esbuildSvelte = await import('esbuild-svelte');
        return [
          esbuildSvelte.default({
            compilerOptions: { css: 'injected' },
          }),
        ];
      } catch {
        // If esbuild-svelte is not available, return empty array
        return [];
      }
    },
    mainFields: ['svelte', 'browser', 'module', 'main'],
  },
  vue: {
    loaders: {
      '.js': 'js',
      '.ts': 'ts',
    },
    plugins: async () => {
      try {
        // Try to load Vue 3 plugin
        const esbuildVue = await import('esbuild-plugin-vue-next');
        return [esbuildVue.default()];
      } catch (e) {
        console.error('Vue plugin load error:', e);
        // Fallback or empty
        return [];
      }
    },
    mainFields: ['browser', 'module', 'main'],
  },
  vanilla: {
    loaders: {
      '.js': 'js',
      '.ts': 'ts',
      '.html': 'text',
      '.css': 'css',
    },
    plugins: undefined,
    mainFields: ['browser', 'module', 'main'],
  },
};

export function detectFramework(entryPath: string): Framework {
  const lowerPath = entryPath.toLowerCase();
  
  if (lowerPath.endsWith('.svelte')) {
    return 'svelte';
  }
  if (lowerPath.endsWith('.vue')) {
    return 'vue';
  }
  if (lowerPath.endsWith('.tsx') || lowerPath.endsWith('.jsx')) {
    return 'react';
  }
  if (lowerPath.endsWith('.html')) {
    return 'vanilla';
  }
  
  // For .js/.ts files, inspect content to detect framework
  try {
    const content = readFileSync(entryPath, 'utf-8');
    // Check for Svelte imports (e.g. import App from './App.svelte')
    if (content.includes('.svelte')) {
      return 'svelte';
    }
    // Check for Vue imports (e.g. import App from './App.vue' or 'vue' package)
    if (content.includes('.vue') || content.includes('from \'vue\'') || content.includes('from "vue"')) {
      return 'vue';
    }
    // Check for React imports
    if (content.includes('react') || content.includes('React')) {
      return 'react';
    }
  } catch {
    // If file cannot be read, fall back to vanilla
  }

  // Default to vanilla for .js/.ts files
  // User can override with --framework flag
  return 'vanilla';
}
