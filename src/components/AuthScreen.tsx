import React, { useState } from 'react';
import { HeartHandshake, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthScreen() {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [fullName, setFullName] = useState('Родитель');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'parent' | 'doctor'>('parent');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'register') {
      await register({ email, password, fullName, role });
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 sm:p-4">
      <div className="opora-device-frame opora-shell opora-mobile-shell flex w-full max-w-none flex-col overflow-hidden font-sans sm:h-[844px] sm:max-w-[410px] sm:rounded-[2rem] sm:border sm:border-white/70">
        <div className="opora-auth-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-6">
          <div className="pt-4 sm:pt-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-opora-sage/12 text-opora-sage">
            <HeartHandshake size={28} />
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-opora-sage">Аккаунт Опоры</p>
          <h1 className="mt-2 font-serif text-[30px] font-semibold leading-tight text-opora-navy sm:text-[34px]">
            {mode === 'register' ? 'Создадим ваш личный кабинет' : 'С возвращением'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-opora-text">
            Данные ребенка, дневник, прогресс и доступы врачей будут привязаны к вашему аккаунту.
          </p>
          <p className="mt-2 text-xs font-medium leading-relaxed text-opora-text/75">
            Уже есть аккаунт? Войдите. Если вы здесь впервые, переключитесь на регистрацию.
          </p>
          </div>

        <form onSubmit={submit} className="mt-6 min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-1 shadow-sm">
            {[
              { id: 'register', label: 'Регистрация' },
              { id: 'login', label: 'Вход' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  clearError();
                  setMode(item.id as typeof mode);
                }}
                className={`min-h-11 rounded-xl px-3 py-2.5 text-sm font-extrabold transition-all ${
                  mode === item.id ? 'bg-opora-navy text-white' : 'text-opora-navy'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-opora-navy">
                  <UserRound size={16} /> Ваше имя
                </span>
                <input
                  value={fullName}
                  onChange={event => setFullName(event.target.value)}
                  className="w-full rounded-2xl border border-black/5 bg-white px-4 py-3 text-base font-semibold text-opora-navy outline-none focus:border-opora-sage"
                  placeholder="Например, Айгуль"
                />
              </label>
              <div>
                <span className="mb-1.5 block text-sm font-bold text-opora-navy">Роль</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'parent', label: 'Родитель' },
                    { id: 'doctor', label: 'Врач' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id as typeof role)}
                      className={`min-h-11 rounded-2xl border px-4 py-3 text-sm font-extrabold ${
                        role === item.id
                          ? 'border-opora-sage bg-opora-sage text-white'
                          : 'border-black/5 bg-white text-opora-navy'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-opora-navy">
              <Mail size={16} /> Email
            </span>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-black/5 bg-white px-4 py-3 text-base font-semibold text-opora-navy outline-none focus:border-opora-sage"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-opora-navy">
              <LockKeyhole size={16} /> Пароль
            </span>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-black/5 bg-white px-4 py-3 text-base font-semibold text-opora-navy outline-none focus:border-opora-sage"
              placeholder="Минимум 8 символов"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
          </label>

          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-relaxed text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !email.trim() || password.length < 8}
            className="min-h-12 w-full rounded-2xl bg-opora-navy px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-opora-navy/15 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading
              ? 'Подождите...'
              : mode === 'register'
                ? 'Создать кабинет'
                : 'Войти'}
          </button>
        </form>

        <p className="mt-5 pb-3 text-center text-[11px] leading-relaxed text-opora-text">
          Опора не ставит диагноз и не заменяет консультацию специалиста.
        </p>
        </div>
      </div>
    </div>
  );
}
