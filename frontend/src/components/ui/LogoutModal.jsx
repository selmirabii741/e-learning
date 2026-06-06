'use client';
import { LogOut, X } from 'lucide-react';

/**
 * LogoutModal — Confirmation dialog before logout.
 * Reusable across Sidebar, Profile, and Pending-Approval pages.
 *
 * @param {boolean} open - Whether the modal is visible
 * @param {() => void} onClose - Called when user cancels
 * @param {() => void} onConfirm - Called when user confirms logout
 * @param {(key: string) => string} [t] - Optional i18n translation function
 */
export default function LogoutModal({ open, onClose, onConfirm, t }) {
    if (!open) return null;

    const tr = (key, fallback) => (t ? t(key) || fallback : fallback);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div
                className="w-full max-w-[420px] rounded-2xl overflow-hidden border animate-fade-in"
                style={{
                    background: 'var(--bg-card, #ffffff)',
                    borderColor: 'var(--border, #e2e8f0)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header gradient bar */}
                <div
                    className="h-1"
                    style={{
                        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)',
                    }}
                />

                <div className="p-6">
                    {/* Icon + Close */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 dark:bg-orange-950/30">
                            <LogOut className="w-6 h-6 text-orange-500" />
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Title */}
                    <h3
                        className="text-lg font-bold mb-2"
                        style={{ color: 'var(--text-primary, #0f172a)' }}
                    >
                        {tr('logout.title', 'Confirmer la déconnexion')}
                    </h3>

                    {/* Description */}
                    <p
                        className="text-sm leading-relaxed mb-6"
                        style={{ color: 'var(--text-secondary, #64748b)' }}
                    >
                        {tr('logout.message', 'Êtes-vous sûr de vouloir vous déconnecter ? Vous serez redirigé vers la page d\'accueil.')}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 border"
                            style={{
                                background: 'var(--bg-hover, #f8fafc)',
                                borderColor: 'var(--border, #e2e8f0)',
                                color: 'var(--text-secondary, #64748b)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--bg-card, #f1f5f9)';
                                e.currentTarget.style.borderColor = 'var(--text-muted, #cbd5e1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)';
                                e.currentTarget.style.borderColor = 'var(--border, #e2e8f0)';
                            }}
                        >
                            {tr('logout.cancel', 'Annuler')}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-90 hover:-translate-y-0.5"
                            style={{
                                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                            }}
                        >
                            <LogOut className="w-4 h-4" />
                            {tr('logout.confirm', 'Se déconnecter')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
