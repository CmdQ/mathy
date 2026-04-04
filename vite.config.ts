import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/mathy/' : '/',
  test: {
    coverage: {
      provider: 'v8' as const,
      include: ['src/question.ts', 'src/score.ts', 'src/shape.ts', 'src/user.ts'],
      thresholds: {
        lines: 70,
        functions: 75,
        branches: 65,
      },
    },
  },
}));
