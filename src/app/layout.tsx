// src/app/layout.tsx

// You'll need to define your metadata and imports (like Inter font if used)
import './globals.css';

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* All application content will render here */}
        {children}
      </body>
    </html>
  );
}