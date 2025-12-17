import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { ApolloWrapper } from '@/lib/apollo-client'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Laundry - Microservices Demo',
  description: 'Demo app consuming REST and GraphQL APIs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloWrapper>
          {children}
        </ApolloWrapper>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
