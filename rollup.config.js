import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import ts from 'typescript';

/**
 * Custom plugin to remove export statements for Google Apps Script compatibility.
 * GAS doesn't support ES modules, so we need to remove export/import statements
 * and keep functions in global scope.
 */
function gasCompatibility() {
  return {
    name: 'gas-compatibility',
    renderChunk(code) {
      // Remove export statements at the end of the file
      // Handles: export { a, b, c };
      let result = code.replace(/^export\s*\{[^}]*\};?\s*$/gm, '');

      // Remove export default statements
      result = result.replace(/^export\s+default\s+/gm, '');

      // Remove export from function/const/let/var declarations
      result = result.replace(/^export\s+(function|const|let|var|class)\s+/gm, '$1 ');

      return {
        code: result,
        map: null
      };
    }
  };
}

export default {
  input: 'src/Code.ts',
  output: {
    file: 'dist/Code.js',
    format: 'esm',
    sourcemap: true,
    banner: `/**
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
          noEmitOnError: false,
          module: 'ESNext'
        },
        include: ['./src/**/*'],
        exclude: ['node_modules', 'dist', '__tests__']
      },
      useTsconfigDeclarationDir: false,
      check: false
    }),
    gasCompatibility()
  ],
  // Mark nothing as external - bundle everything
  external: [],
  // Disable tree shaking for entry point to preserve all exports
  treeshake: {
    moduleSideEffects: true,
    propertyReadSideEffects: true
  }
};
