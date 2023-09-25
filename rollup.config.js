import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import json from '@rollup/plugin-json';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import terser from '@rollup/plugin-terser';
import merge from 'lodash.merge';
import path from 'path';
const pkg = JSON.parse(
	readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const extensions = ['.js', '.ts'];
const pathResolve = function (...args) {
	return path.resolve(__dirname, ...args);
};

// 打包任务的个性化配置
const jobs = {
	esm: {
		output: {
			format: 'esm',
			file: pathResolve(pkg.module)
		}
	},
	cjs: {
		output: {
			format: 'cjs',
			file: pathResolve('dist/index.cjs.js')
		}
	},
	umd: {
		output: {
			format: 'umd',
			file: pathResolve(pkg.main)
		}
	},
	min: {
		output: {
			format: 'umd',
			file: pathResolve(pkg.main.replace(/(.\w+)$/, '.min$1'))
		},
		plugins: [
			terser({
				compress: true,
				mangle: true
			})
		]
	}
};

const mergeConfig = jobs[process.env.NODE_ENV || 'esm'];

export default merge(
	{
		input: 'src/index.ts',
		output: {
			file: 'dist/tti.js',
			format: 'esm',
			name: 'tti'
		},
		plugins: [
			json(),
			resolve({
				extensions,
				modulesOnly: true
			}),
			typescript({
				useTsconfigDeclarationDir: true,
				tsconfig: 'tsconfig.json',
				tsconfigOverride: {
					compilerOptions: { declarationDir: 'dist/types', outDir: 'dist', declaration: true }
				},
				exclude: ['test/**', 'node_modules/**']
			}),
			babel({
				exclude: 'node_modules/**',
				extensions,
				babelHelpers: 'bundled'
			})
		]
	},
	mergeConfig
);
