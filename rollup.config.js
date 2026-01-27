import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import ts from 'typescript';

export default {
  input: 'src/Code.ts',
  output: {
    file: 'dist/Code.js',
    format: 'iife',
    name: 'MobTimerBot',
    sourcemap: true,
    banner: `
/**
 * Mob Timer Bot for Google Apps Script
 * @function doGet
 * @function doPost
 * @function jobEventHandler
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
    })
  ],
  external: []
};
