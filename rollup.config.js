import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import ts from 'typescript';
import cleanup from 'rollup-plugin-cleanup';

export default {
  input: 'src/Code.ts',
  output: {
    file: 'dist/Code.js',
    format: 'iife',
    name: 'MobTimerBot',
    // Expose functions to global scope for GAS
    footer: `
function doGet(e) { return MobTimerBot.doGet(e); }
function doPost(e) { return MobTimerBot.doPost(e); }
function jobEventHandler(e) { return MobTimerBot.jobEventHandler(e); }
`,
    sourcemap: true,
    banner: `/**
 * Mob Timer Bot for Google Apps Script
 */
`
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
    }),
    cleanup({
      comments: 'none',
      extensions: ['ts']
    })
  ],
  external: []
};
