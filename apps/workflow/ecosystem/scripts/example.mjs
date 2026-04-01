import { mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const outdir = path.join(projectRoot, '.example-app')

await mkdir(outdir, { recursive: true })
await copyFile(
	path.join(projectRoot, 'index.html'),
	path.join(outdir, 'index.html')
)

const ctx = await esbuild.context({
	entryPoints: [path.join(projectRoot, 'src', 'examples', 'app.jsx')],
	outfile: path.join(outdir, 'app.js'),
	bundle: true,
	format: 'esm',
	sourcemap: true,
	loader: {
		'.js': 'jsx',
		'.jsx': 'jsx',
	},
	define: {
		'process.env.NODE_ENV': '"development"',
	},
})

await ctx.watch()
const { hosts, port } = await ctx.serve({
	servedir: outdir,
	host: '127.0.0.1',
})

console.log(`Workflow examples running at http://${hosts[0]}:${port}`)
