import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(frontend, '.output/public')
const web = resolve(frontend, '../web')

if (!existsSync(join(source, 'index.html'))) {
  throw new Error('Generate the Nuxt app before copying the static output.')
}
mkdirSync(web, { recursive: true })
// Replace only generated Nuxt files; retain Craft's bootstrap and resources.
rmSync(join(web, '_nuxt'), { recursive: true, force: true })
rmSync(join(web, 'api/_content'), { recursive: true, force: true })
cpSync(source, web, {
  recursive: true,
  filter: (path) => path !== join(source, 'index.php') && !path.endsWith('/.gitkeep'),
})
console.log('Copied Nuxt static output to web/; Craft index.php was preserved.')
