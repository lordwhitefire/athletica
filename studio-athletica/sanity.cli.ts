import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'cuiis46d',
    dataset: 'production'
  },
  deployment: {
    appId: 'dh2uo5o1m9yuwce6gi4iyftc',
    autoUpdates: true,
  }
})
