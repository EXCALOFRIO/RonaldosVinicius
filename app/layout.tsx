import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"
import { Inter } from 'next/font/google' // Using Inter font for better UI

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Drógate seguro',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      {/* Apply font and base background to the body */}
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}