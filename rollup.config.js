import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import ts from 'typescript';

// GAS entry point functions to expose globally
const gasEntryPoints = ['doGet', 'doPost', 'jobEventHandler', 'handleCallback'];

export default {
  input: 'src/Code.ts',
  output: {
    file: 'dist/Code.js',
    format: 'iife',
    name: 'MobTimerBot',
    footer: gasEntryPoints.map(fn => `function ${fn}(e) { return MobTimerBot.${fn}(e); }`).join('\n')
  },
  plugins: [
    resolve({
      browser: false,
      preferBuiltins: true
    }),
    commonjs(),
    typescript({
      typescript: ts,
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
          declarationMap: false,
          rootDir: './src',
          skipLibCheck: true,
          noEmitOnError: false
        },
        include: ['./src/**/*'],
        exclude: ['node_modules', 'dist', '__tests__']
      },
      useTsconfigDeclarationDir: false,
      check: false
    })
  ],
  external: []
};
