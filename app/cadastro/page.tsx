'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatTelefone(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export default function CadastroPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    clinicaNome: '',
    cnpj: '',
    emailAdmin: '',
    senha: '',
    confirmarSenha: '',
    nomeResponsavel: '',
    telefone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (form.senha !== form.confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }
    if (form.senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    const result = await register({
      clinicaNome: form.clinicaNome,
      cnpj: form.cnpj,
      emailAdmin: form.emailAdmin,
      senha: form.senha,
      nomeResponsavel: form.nomeResponsavel,
      telefone: form.telefone,
    });

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error ?? 'Erro ao criar conta.');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: '#1B2A4A' }}
    >
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wide" style={{ color: '#C9A84C' }}>
            Clínica
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Sistema de Gestão
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#1B2A4A' }}>
            Criar conta
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Preencha os dados da sua clínica para começar.
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Seção: Clínica */}
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
                Dados da Clínica
              </legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                    Nome da Clínica <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.clinicaNome}
                    onChange={(e) => handleChange('clinicaNome', e.target.value)}
                    placeholder="Ex: Clínica Bella Estética"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                    CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => handleChange('cnpj', formatCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                  />
                </div>
              </div>
            </fieldset>

            {/* Seção: Responsável */}
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
                Responsável
              </legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                    Nome do Responsável <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nomeResponsavel}
                    onChange={(e) => handleChange('nomeResponsavel', e.target.value)}
                    placeholder="Nome completo"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => handleChange('telefone', formatTelefone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                  />
                </div>
              </div>
            </fieldset>

            {/* Seção: Acesso */}
            <fieldset>
              <legend className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
                Dados de Acesso
              </legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                    Email do Administrador <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.emailAdmin}
                    onChange={(e) => handleChange('emailAdmin', e.target.value)}
                    placeholder="admin@clinica.com.br"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                      Senha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={form.senha}
                      onChange={(e) => handleChange('senha', e.target.value)}
                      placeholder="Mín. 6 caracteres"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#1B2A4A' }}>
                      Confirmar Senha <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={form.confirmarSenha}
                      onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                      placeholder="Repita a senha"
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#C9A84C', color: '#1B2A4A' }}
            >
              {loading ? 'Criando conta…' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm mt-6 text-gray-500">
            Já tem conta?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#C9A84C' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
