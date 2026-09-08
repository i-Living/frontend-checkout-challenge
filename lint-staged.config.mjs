export default {
    'apps/web/src/**/*.{ts,tsx,css}': (filenames) => {
        const files = filenames.filter((name) => !name.endsWith('generated.d.ts'))
        if (files.length === 0) return []
        return [`biome format --write ${files.join(' ')}`, `biome check --write ${files.join(' ')}`]
    },
}
