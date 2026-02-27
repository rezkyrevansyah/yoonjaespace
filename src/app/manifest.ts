import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Yoonjaespace Studio',
    short_name: 'Yoonjaespace',
    description: 'Sistem manajemen studio foto Yoonjaespace',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#7A1F1F',
    icons: [
      {
        src: '/logo_yoonjae.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
