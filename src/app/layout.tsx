import './globals.css'
import { TopNav, Sidebar, Footer, MobileNav } from '@/components/layout'

export const metadata = {
  title: 'AI Research Learning Platform',
  description: 'Phase 3 layout scaffold for the AI Research Learning Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <TopNav />
        <MobileNav />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  )
}

