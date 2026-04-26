import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'EMF Pollution GIS',
  description: 'Analizë Interaktive Elektromagnetike',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="sq">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        </head>
        <body><ThemeProvider>{children}</ThemeProvider></body>
      </html>
    </ClerkProvider>
  )
}
