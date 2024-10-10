import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/command.ts',
    'src/index.ts',
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
