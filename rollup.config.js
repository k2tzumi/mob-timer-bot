import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import ts from 'typescript';

const getExportedFunctionNames = (filePath) => {
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(filePath);
  const functionNames = [];

  if (!sourceFile) return functionNames;

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) return functionNames;

  const exports = checker.getExportsOfModule(moduleSymbol);

  exports.forEach((symbol) => {
    let targetSymbol = symbol;
    if (symbol.flags & ts.SymbolFlags.Alias) {
      targetSymbol = checker.getAliasedSymbol(symbol);
    }

    const declarations = targetSymbol.getDeclarations() || [];
    
    const isFunction = declarations.some(decl => {
      if (ts.isFunctionDeclaration(decl)) return true;
      
      if (ts.isVariableDeclaration(decl)) {
        if (decl.initializer) {
          return (
            ts.isArrowFunction(decl.initializer) || 
            ts.isFunctionExpression(decl.initializer)
          );
        }
        const type = checker.getTypeAtLocation(decl);
        const signatures = type.getCallSignatures();
        return signatures.length > 0;
      }

      return false;
    });

    if (isFunction) {
      functionNames.push(symbol.getName());
    }
  });

  return functionNames;
};

const targetFunctions = getExportedFunctionNames('src/Code.ts');

export default {
  input: 'src/Code.ts',
  output: {
    file: 'dist/Code.js',
    format: 'iife',
    name: 'MobTimerBot',
    sourcemap: true,
    banner: `/**
 * Mob Timer Bot for Google Apps Script
${targetFunctions.map(fn => ` * @function ${fn}`).join('\n')}
 */`,
    footer: `
/* Global scope exports */
${targetFunctions.map(fn => `this.${fn} = MobTimerBot.${fn};`).join('\n')}
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
