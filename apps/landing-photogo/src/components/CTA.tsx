"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { FadeInSection } from "./FadeInSection";
import { useState } from "react";

export function CTA() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Digite um email válido');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Inscrito com sucesso!');
        e.currentTarget.reset();
      } else {
        setStatus('error');
        setMessage(data.error || 'Erro ao inscrever');
      }
    } catch (err) {
      setStatus('error');
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessage(`Erro: ${errMsg}`);
      console.error('[CTA] fetch error:', err);
    }
  };

  return (
    <section id="early-access" className="border-t border-ink-900/5 py-20 dark:border-paper-100/5 sm:py-32">
      <div className="container-narrow">
        <FadeInSection>
          <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-8 py-16 shadow-2xl dark:bg-ink-800 sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="absolute inset-0 -z-0 bg-gradient-to-br from-sunset-500/20 via-transparent to-transparent"
            />
            <div
              aria-hidden
              className="absolute -top-32 -right-32 -z-0 h-96 w-96 animate-pulse-soft rounded-full bg-sunset-500/20 blur-3xl"
            />

            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-balance font-mono text-4xl font-semibold tracking-tight text-paper-50 sm:text-5xl">
                Pronto para vender suas fotos?
              </h2>
              <p className="mt-4 text-pretty text-lg text-paper-200">
                Estamos abrindo para os primeiros 100 fotógrafos. Acesso antecipado comissões reduzidas.
              </p>

              <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  disabled={status === 'loading'}
                  className="w-full rounded-full border border-paper-100/10 bg-ink-700 px-5 py-3 text-sm text-paper-50 placeholder:text-paper-300 transition focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-500/40 disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={status === 'loading'}
                  className="btn-primary shrink-0 flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Inscrevendo...</span>
                    </>
                  ) : status === 'success' ? (
                    <>
                      <Check className="h-4 w-4" strokeWidth={2} />
                      <span>Inscrito!</span>
                    </>
                  ) : (
                    <>
                      Quero entrar
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {message && (
                <p className={`mt-4 text-center text-sm ${
                  status === 'error' ? 'text-red-400' : 'text-green-400'
                }`}>
                  {message}
                </p>
              )}

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-paper-200">
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" strokeWidth={2.5} />
                  Sem cartão
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" strokeWidth={2.5} />
                  Acesso vitalício
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-green-400" strokeWidth={2.5} />
                  Configure em 5min
                </li>
              </ul>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
