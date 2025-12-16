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
        // Bun may have native Svelte support
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
        const esbuildVue = await import('esbuild-vue');
        return [esbuildVue.default()];
      } catch {
        // If esbuild-vue is not available, return empty array
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
  
  // Default to vanilla for .js/.ts files
  // User can override with --framework flag
  return 'vanilla';
}

