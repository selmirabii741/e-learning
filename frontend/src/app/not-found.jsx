'use client';
import Link from 'next/link';
import { GraduationCap, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.05 }} />
            <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--accent)', opacity: 0.05 }} />

            <div className="relative text-center px-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg" style={{ background: 'var(--accent)' }}>
                    <GraduationCap className="w-8 h-8 text-white" />
                </div>

                <h1 className="text-8xl font-black mb-4 select-none" style={{ color: 'var(--accent)' }}>
                    404
                </h1>

                <h2 className="text-2xl font-bold mb-3 text-[var(--text-primary)]">Page introuvable</h2>
                <p className="max-w-sm mx-auto mb-8 text-[var(--text-muted)]">
                    La page que vous cherchez n&apos;existe pas ou a été déplacée.
                </p>

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="btn-secondary"
                    >
                        <ArrowLeft className="w-4 h-4" /> Retour
                    </button>
                    <Link href="/" className="btn-primary">
                        <Home className="w-4 h-4" /> Accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
