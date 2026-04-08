import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mypoop.app',
  appName: 'My Poop',
  webDir: '.output/public',
  plugins: {
    Geolocation: {},
  },
}

export default config
