import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kz.opora.parents',
  appName: 'Опора',
  webDir: 'dist',
  server: {
    url: 'https://opora-seven.vercel.app',
    cleartext: false
  }
};

export default config;
