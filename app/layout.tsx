import './globals.css';
import Sidebar from '../components/Sidebar';

export const metadata = {
  title: 'Clinica SAAS',
  description: 'Sistema de gestão para clínicas de estética'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
