import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ClientShell from '@/components/ClientShell';

export const metadata = {
  title: 'Clínica — Sistema de Gestão',
  description: 'Sistema de gestão para clínicas de estética',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <ClientShell>{children}</ClientShell>
        </AuthProvider>
      </body>
    </html>
  );
}
