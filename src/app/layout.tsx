import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WAVE - 음악으로 연결되는 새로운 세상',
  description: '친구들과 실시간으로 음악을 공유하고, 새로운 음악을 발견하는 소셜 플랫폼',
  keywords: '음악, 소셜, 플레이리스트, 챌린지, 공유',
  authors: [{ name: 'WAVE Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ff6600',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-sk4-off-white">
          {children}
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
