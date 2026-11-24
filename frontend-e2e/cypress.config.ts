import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

// `frontend:serve` is the only target that proxies /api to the API and starts
// the API with it (dependsOn api:serve). `serve-static` has no proxy, so it is
// not used even on CI.
const webServerCommand = 'npx nx run frontend:serve';

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
      cypressDir: 'src',
      webServerCommands: { default: webServerCommand },
      ciWebServerCommand: webServerCommand,
      ciBaseUrl: 'http://localhost:4200',
      // The first Angular dev build plus the API start take a while.
      webServerConfig: { timeout: 180_000 },
    }),
    baseUrl: 'http://localhost:4200',
  },
});
