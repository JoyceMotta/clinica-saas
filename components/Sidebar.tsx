'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, ROLE_LABELS, UserRole } from '@/context/AuthContext';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function IconClientes() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconAgenda() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconCatalogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function IconFinanceiro() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconDocumentos() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconPainelAdmin() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconAnalisador() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function IconConfig() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconSair() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

// ─── Nav items com controle por perfil ────────────────────────────────────────

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
};

const navItems: NavItem[] = [
  { label: 'Dashboard',     href: '/',              icon: <IconDashboard />,  roles: ['admin', 'profissional', 'recepcionista'] },
  { label: 'Clientes',      href: '/clientes',      icon: <IconClientes />,   roles: ['admin', 'recepcionista'] },
  { label: 'Agenda',        href: '/agenda',         icon: <IconAgenda />,     roles: ['admin', 'profissional', 'recepcionista'] },
  { label: 'Catálogo',      href: '/catalogo',       icon: <IconCatalogo />,   roles: ['admin'] },
  { label: 'Financeiro',    href: '/financeiro',     icon: <IconFinanceiro />, roles: ['admin'] },
  { label: 'Configurações', href: '/configuracoes',  icon: <IconConfig />,     roles: ['admin'] },
  { label: 'Painel Admin',  href: '/admin',          icon: <IconPainelAdmin />, roles: ['admin'] },
  { label: 'Documentos',   href: '/documentos',     icon: <IconDocumentos />,  roles: ['admin', 'profissional'] },
  { label: 'Analisador IA', href: '/analisador',    icon: <IconAnalisador />, roles: ['admin'] },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const visibleItems = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col h-full"
      style={{ backgroundColor: '#1B2A4A', color: '#FAF7F2' }}
    >
      {/* Logo */}
      <div className="px-6 py-8 border-b" style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
        <span className="text-2xl font-bold tracking-wide" style={{ color: '#C9A84C' }}>
          Clínica
        </span>
        <p className="text-xs mt-1 opacity-60">Sistema de Gestão</p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-1">
          {visibleItems.map(({ label, href, icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={active ? { backgroundColor: '#C9A84C', color: '#1B2A4A' } : { color: '#FAF7F2' }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(201,168,76,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {icon}
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Rodapé: usuário + sair */}
      <div className="border-t" style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
        {user && (
          <div className="px-5 py-3">
            <p className="text-sm font-semibold truncate" style={{ color: '#FAF7F2' }}>
              {user.nome}
            </p>
            <p className="text-xs opacity-50 mt-0.5">{ROLE_LABELS[user.role]}</p>
          </div>
        )}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#FAF7F2' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(201,168,76,0.15)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
          >
            <IconSair />
            Sair
          </button>
        </div>
        <div className="px-6 pb-4 text-xs opacity-30 border-t" style={{ borderColor: 'rgba(201,168,76,0.2)', paddingTop: '0.75rem' }}>
          © {new Date().getFullYear()} Clínica SAAS
        </div>
      </div>
    </aside>
  );
}
