export default {
    'apps/web/src/**/*.{ts,tsx,css}': (filenames) => {
        const files = filenames.filter((name) => !name.endsWith('generated.d.ts'))
        if (files.length === 0) return []
        const quoted = files.map((file) => `"${file}"`).join(' ')
        return [`biome check --write ${quoted}`]
    },
}
