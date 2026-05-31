'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/lib/authStore';
import { studentAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
    Settings, User, Lock, Bell, Palette, Globe, Shield, 
    Laptop, Smartphone, Eye, EyeOff, Loader2, Copy, Check, 
    ShieldCheck, Activity, Key, CheckCircle2, AlertCircle 
} from 'lucide-react';

/* ── Design tokens ─────────────────────────────────────────────────────── */
const T = {
    colors: { 
        primary: '#4F46E5', 
        secondary: '#6366F1', 
        success: '#10B981', 
        warning: '#F59E0B', 
        danger: '#EF4444',
        accentDim: '#EEF2FF',
        bgHover: '#F8FAFC',
        border: '#E2E8F0'
    },
    card: { 
        bg: '#ffffff', 
        border: '1px solid #E2E8F0', 
        radius: '24px', 
        shadow: '0 10px 30px -5px rgba(79, 70, 229, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.01)' 
    },
    text: { 
        primary: '#0F172A', 
        secondary: '#475569', 
        muted: '#94A3B8' 
    },
};

const SECTIONS = [
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'security', icon: Lock, label: 'Sécurité' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'theme', icon: Palette, label: 'Apparence' },
    { id: 'language', icon: Globe, label: 'Langue' },
    { id: 'platform', icon: Shield, label: 'Plateforme' },
];

export default function SettingsPage() {
    const { user, isLoading, updateUser } = useAuthStore();
    const [activeSection, setActiveSection] = useState('profile');

    // Profile States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isProfileSaving, setIsProfileSaving] = useState(false);

    // Password States
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // 2FA States (Frontend implementation with TODO)
    const [is2FaEnabled, setIs2FaEnabled] = useState(false);
    const [show2FaSetup, setShow2FaSetup] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isCopying, setIsCopying] = useState(false);
    const [isVerifying2Fa, setIsVerifying2Fa] = useState(false);

    // Active Sessions States (Frontend implementation with TODO)
    const [sessions, setSessions] = useState([
        { id: 1, device: 'Chrome sur Windows 11', location: 'Paris, France', current: true, ip: '192.168.1.50', lastActive: 'Actif maintenant' },
        { id: 2, device: 'Safari sur iPhone 15 Pro', location: 'Lyon, France', current: false, ip: '192.168.1.102', lastActive: 'Il y a 2 heures' },
        { id: 3, device: 'Firefox sur macOS', location: 'Toulouse, France', current: false, ip: '80.45.12.11', lastActive: 'Il y a 3 jours' },
    ]);

    // Connection History Logs
    const loginHistory = [
        { id: 1, device: 'Chrome · Windows 11', ip: '192.168.1.50', status: 'Réussi', date: '25 mai 2026, 23:10' },
        { id: 2, device: 'Safari · iPhone 15 Pro', ip: '192.168.1.102', status: 'Réussi', date: '25 mai 2026, 21:05' },
        { id: 3, device: 'Firefox · macOS', ip: '80.45.12.11', status: 'Réussi', date: '22 mai 2026, 14:32' },
        { id: 4, device: 'Chrome · Windows 11', ip: '198.51.100.12', status: 'Bloqué (IP Suspecte)', date: '20 mai 2026, 09:15' },
    ];

    // Initialize user profile details
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    // Handle hash route changes (e.g. #security)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.replace('#', '');
            if (hash && SECTIONS.some(sec => sec.id === hash)) {
                setActiveSection(hash);
            }
        }
    }, []);

    // ── Safe Role Check ──
    const userRole = user?.role || user?.type || '';
    const isAdmin = typeof userRole === 'string' && userRole.toLowerCase() === 'admin';

    // Loading State
    if (isLoading) {
        return (
            <Sidebar>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <Loader2 className="animate-spin" size={36} style={{ color: T.colors.primary }} />
                        <p style={{ color: T.text.secondary, fontSize: 15, fontWeight: 600 }}>Chargement des configurations...</p>
                    </div>
                </div>
            </Sidebar>
        );
    }

    // Access Denied / Fallback State
    if (!user || !isAdmin) {
        return (
            <Sidebar>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh', padding: 24 }}>
                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '48px 32px', boxShadow: T.card.shadow, textAlign: 'center', maxWidth: 450 }}>
                        <div style={{ width: 64, height: 64, borderRadius: '20px', background: `${T.colors.danger}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Shield size={32} style={{ color: T.colors.danger }} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text.primary, marginBottom: 12 }}>Accès Non Autorisé</h2>
                        <p style={{ fontSize: 14, color: T.text.secondary, lineHeight: '1.6', marginBottom: 28 }}>
                            Seuls les administrateurs de la plateforme EduAI ont accès à ces configurations de sécurité globales.
                        </p>
                        <a href="/profile" style={{ display: 'inline-block', width: '100%', padding: '14px 24px', borderRadius: '14px', background: T.colors.primary, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', transition: 'background 0.2s', boxShadow: `0 4px 14px ${T.colors.primary}30` }} className="hover:opacity-90">
                            Retourner à mon profil
                        </a>
                    </div>
                </div>
            </Sidebar>
        );
    }

    // ── API Profile Save ──
    const handleProfileSave = async () => {
        if (!name.trim()) {
            toast.error('Le nom complet ne peut pas être vide');
            return;
        }
        setIsProfileSaving(true);
        try {
            const { data } = await studentAPI.updateProfile({ name });
            setName(data.user.name);
            updateUser({ name: data.user.name });
            toast.success('Informations personnelles mises à jour !');
        } catch (err) {
            console.error('Error updating profile:', err);
            toast.error('Une erreur est survenue lors de la mise à jour');
        } finally {
            setIsProfileSaving(false);
        }
    };

    // ── API Password Update ──
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!pwForm.current.trim()) { 
            toast.error('Veuillez entrer votre mot de passe actuel'); 
            return; 
        }
        if (pwForm.newPw.length < 8) { 
            toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères'); 
            return; 
        }
        if (pwForm.newPw !== pwForm.confirm) { 
            toast.error('Les nouveaux mots de passe ne correspondent pas'); 
            return; 
        }
        if (pwForm.current === pwForm.newPw) { 
            toast.error('Le nouveau mot de passe doit être différent de l\'actuel'); 
            return; 
        }

        setPwSaving(true);
        try {
            await studentAPI.changePassword({
                currentPassword: pwForm.current,
                newPassword: pwForm.newPw,
                confirmPassword: pwForm.confirm,
            });
            toast.success('Mot de passe mis à jour avec succès !');
            setPwForm({ current: '', newPw: '', confirm: '' });
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur lors du changement de mot de passe. Veuillez vérifier vos accès.';
            toast.error(msg);
        } finally {
            setPwSaving(false);
        }
    };

    // ── Mock 2FA Actions ──
    const copyToClipboard = () => {
        navigator.clipboard.writeText('JBSWY3DPEHPK3PXP');
        setIsCopying(true);
        toast.success('Clé de sécurité copiée !');
        setTimeout(() => setIsCopying(false), 2000);
    };

    const confirm2FaSetup = () => {
        if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
            toast.error('Veuillez saisir un code de vérification valide à 6 chiffres');
            return;
        }
        setIsVerifying2Fa(true);
        // Simulate API delay
        setTimeout(() => {
            setIsVerifying2Fa(false);
            setIs2FaEnabled(true);
            setShow2FaSetup(false);
            setVerificationCode('');
            toast.success('Double authentification activée avec succès !');
        }, 1200);
    };

    const disable2Fa = () => {
        setIs2FaEnabled(false);
        toast.success('La double authentification a été désactivée.');
    };

    // ── Mock Session Revocation ──
    const terminateSession = (id) => {
        const session = sessions.find(s => s.id === id);
        setSessions(prev => prev.filter(s => s.id !== id));
        toast.success(`La session sur l'appareil ${session?.device} a été révoquée.`);
    };

    const terminateAllOtherSessions = () => {
        setSessions(prev => prev.filter(s => s.current));
        toast.success('Toutes les autres sessions actives ont été révoquées avec succès.');
    };

    return (
        <Sidebar>
            <div className="min-h-full" style={{ background: 'var(--bg-body)', margin: '-20px', padding: '32px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    
                    {/* Header */}
                    <div style={{ marginBottom: 36 }}>
                        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '12px', background: T.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${T.colors.primary}30` }}>
                                <Settings size={20} className="text-white" />
                            </div>
                            Paramètres
                        </h1>
                        <p style={{ fontSize: 14, color: T.text.muted, marginTop: 6, fontWeight: 500 }}>
                            Configurez votre profil d'administrateur, gérez la sécurité et supervisez les privilèges de votre compte.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }} className="flex flex-col md:grid">
                        
                        {/* Sidebar Menu */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {SECTIONS.map((sec) => {
                                const Icon = sec.icon;
                                const isActive = activeSection === sec.id;
                                return (
                                    <button
                                        key={sec.id}
                                        onClick={() => {
                                            setActiveSection(sec.id);
                                            if (typeof window !== 'undefined') window.location.hash = sec.id;
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '14px 18px', borderRadius: '14px', border: 'none',
                                            background: isActive ? '#fff' : 'transparent',
                                            boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.05)' : 'none',
                                            color: isActive ? T.colors.primary : T.text.secondary,
                                            fontWeight: isActive ? 700 : 600, fontSize: 14,
                                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                        }}
                                        className={!isActive ? 'hover:bg-slate-100 hover:text-slate-900' : ''}
                                    >
                                        <Icon size={18} style={{ color: isActive ? T.colors.primary : T.text.muted }} /> 
                                        {sec.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

                            {/* ── SECTION: PROFILE ── */}
                            {activeSection === 'profile' && (
                                <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <User size={18} style={{ color: T.colors.primary }} /> Informations du profil
                                    </h2>
                                    <p style={{ fontSize: 13, color: T.text.muted, marginBottom: 24 }}>
                                        Gérez vos informations de compte personnelles. Les modifications affectent votre identité sur l'ensemble du système.
                                    </p>

                                    <div style={{ display: 'grid', gap: 20 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text.secondary, marginBottom: 8 }}>Nom complet</label>
                                            <input 
                                                type="text" 
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 14, color: T.text.primary, outline: 'none', transition: 'all 0.2s' }} 
                                                className="focus:border-indigo-500" 
                                                placeholder="Saisissez votre nom"
                                            />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 8 }}>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text.secondary }}>Adresse email</label>
                                                <span style={{ fontSize: 11, color: T.colors.warning, fontWeight: 600 }}>Géré par Keycloak</span>
                                            </div>
                                            <input 
                                                type="email" 
                                                value={email}
                                                disabled
                                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 14, color: T.text.muted, background: '#F8FAFC', cursor: 'not-allowed', outline: 'none' }} 
                                            />
                                            <p style={{ fontSize: 11, color: T.text.muted, marginTop: 6 }}>
                                                L'adresse de messagerie ne peut être modifiée car elle est synchronisée avec la fédération d'identité Keycloak.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleProfileSave}
                                            disabled={isProfileSaving}
                                            style={{ 
                                                marginTop: 12, padding: '12px 24px', borderRadius: '12px', 
                                                background: T.colors.primary, color: '#fff', fontSize: 14, 
                                                fontWeight: 700, border: 'none', cursor: 'pointer', 
                                                alignSelf: 'flex-start', transition: 'opacity 0.2s',
                                                display: 'flex', alignItems: 'center', gap: 8
                                            }} 
                                            className="hover:opacity-90 transition-colors"
                                        >
                                            {isProfileSaving && <Loader2 className="animate-spin" size={16} />}
                                            {isProfileSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── SECTION: SECURITY ── */}
                            {activeSection === 'security' && (
                                <>
                                    {/* Card 1: Change Password Form */}
                                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Lock size={18} style={{ color: T.colors.primary }} /> Modifier le mot de passe
                                        </h2>
                                        <p style={{ fontSize: 13, color: T.text.muted, marginBottom: 24 }}>
                                            Pour des raisons de sécurité, nous vous conseillons d'utiliser un mot de passe fort et unique pour ce compte.
                                        </p>

                                        <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: 20, maxWidth: 550 }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text.secondary, marginBottom: 8 }}>Mot de passe actuel</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type={showCurrent ? 'text' : 'password'}
                                                        value={pwForm.current}
                                                        onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                                                        placeholder="Saisissez votre mot de passe actuel"
                                                        style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                                                        className="focus:border-indigo-500"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowCurrent(!showCurrent)}
                                                        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: T.text.muted }}
                                                    >
                                                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text.secondary, marginBottom: 8 }}>Nouveau mot de passe</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type={showNew ? 'text' : 'password'}
                                                        value={pwForm.newPw}
                                                        onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                                                        placeholder="Min. 8 caractères (lettres, chiffres, caractères spéciaux)"
                                                        style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                                                        className="focus:border-indigo-500"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowNew(!showNew)}
                                                        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: T.text.muted }}
                                                    >
                                                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                
                                                {/* Password strength indicator */}
                                                {pwForm.newPw.length > 0 && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <div style={{ display: 'flex', gap: 4, height: 4, borderRadius: 2, overflow: 'hidden', background: '#E2E8F0', marginBottom: 6 }}>
                                                            <div style={{ 
                                                                width: pwForm.newPw.length < 6 ? '33%' : pwForm.newPw.length < 10 ? '66%' : '100%', 
                                                                background: pwForm.newPw.length < 6 ? T.colors.danger : pwForm.newPw.length < 10 ? T.colors.warning : T.colors.success,
                                                                transition: 'all 0.3s'
                                                            }} />
                                                        </div>
                                                        <span style={{ 
                                                            fontSize: 11, 
                                                            fontWeight: 600,
                                                            color: pwForm.newPw.length < 6 ? T.colors.danger : pwForm.newPw.length < 10 ? T.colors.warning : T.colors.success
                                                        }}>
                                                            {pwForm.newPw.length < 6 ? 'Trop faible (min 8 caractères recommandés)' : pwForm.newPw.length < 10 ? 'Moyen' : 'Fort et sécurisé'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.text.secondary, marginBottom: 8 }}>Confirmer le nouveau mot de passe</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type={showConfirm ? 'text' : 'password'}
                                                        value={pwForm.confirm}
                                                        onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                                                        placeholder="Saisissez à nouveau le nouveau mot de passe"
                                                        style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 14, outline: 'none' }}
                                                        className="focus:border-indigo-500"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowConfirm(!showConfirm)}
                                                        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: T.text.muted }}
                                                    >
                                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                </div>
                                                
                                                {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                                                    <p style={{ fontSize: 11, color: T.colors.danger, marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <AlertCircle size={12} /> Les mots de passe ne correspondent pas
                                                    </p>
                                                )}
                                            </div>

                                            <button 
                                                type="submit"
                                                disabled={pwSaving || !pwForm.current || !pwForm.newPw || !pwForm.confirm || pwForm.newPw.length < 8 || pwForm.newPw !== pwForm.confirm}
                                                style={{ 
                                                    marginTop: 8, padding: '12px 24px', borderRadius: '12px', 
                                                    background: T.colors.primary, color: '#fff', fontSize: 14, 
                                                    fontWeight: 700, border: 'none', cursor: 'pointer', 
                                                    alignSelf: 'flex-start', opacity: (pwForm.newPw.length >= 8 && pwForm.newPw === pwForm.confirm) ? 1 : 0.6,
                                                    display: 'flex', alignItems: 'center', gap: 8
                                                }}
                                                className="hover:opacity-90 transition-all"
                                            >
                                                {pwSaving ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                                                {pwSaving ? 'Mise à jour en cours...' : 'Mettre à jour le mot de passe'}
                                            </button>
                                        </form>
                                    </div>

                                    {/* Card 2: Two-Factor Authentication (2FA) */}
                                    {/* TODO: Wire 2FA toggling and key verification to authentication backend endpoints */}
                                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, marginBottom: 8 }} className="flex flex-col sm:flex-row sm:items-center">
                                            <div>
                                                <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Key size={18} style={{ color: T.colors.primary }} /> Double Authentification (2FA)
                                                </h2>
                                                <p style={{ fontSize: 13, color: T.text.muted, marginTop: 4 }}>
                                                    Ajoutez une couche de sécurité supplémentaire en validant vos connexions avec un mot de passe à usage unique généré par votre application d'authentification mobile (Google Authenticator, Bitwarden, Authy, etc.).
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <span style={{ 
                                                    fontSize: 11, 
                                                    fontWeight: 700, 
                                                    padding: '4px 10px', 
                                                    borderRadius: '99px',
                                                    background: is2FaEnabled ? `${T.colors.success}15` : `${T.colors.warning}15`,
                                                    color: is2FaEnabled ? T.colors.success : T.colors.warning
                                                }}>
                                                    {is2FaEnabled ? 'Activé (Recommandé)' : 'Inactif'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 24 }}>
                                            {!is2FaEnabled && !show2FaSetup && (
                                                <button 
                                                    onClick={() => setShow2FaSetup(true)}
                                                    style={{ padding: '12px 20px', borderRadius: '12px', background: T.colors.accentDim, color: T.colors.primary, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                                    className="hover:opacity-90"
                                                >
                                                    Configurer la double authentification
                                                </button>
                                            )}

                                            {is2FaEnabled && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.colors.success, fontSize: 13, fontWeight: 600 }}>
                                                        <CheckCircle2 size={16} /> Votre compte est actuellement protégé par la double authentification.
                                                    </div>
                                                    <button 
                                                        onClick={disable2Fa}
                                                        style={{ padding: '12px 20px', borderRadius: '12px', background: `${T.colors.danger}10`, color: T.colors.danger, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}
                                                        className="hover:bg-red-100"
                                                    >
                                                        Désactiver la double authentification
                                                    </button>
                                                </div>
                                            )}

                                            {show2FaSetup && (
                                                <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #E2E8F0', marginTop: 16 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 24 }} className="flex flex-col sm:grid">
                                                        {/* QR Code Container */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #E2E8F0', padding: 12, borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                                            {/* SVG Mockup of dynamic, styled QR code */}
                                                            <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <rect width="100" height="100" rx="12" fill="white"/>
                                                                {/* Corners */}
                                                                <rect x="10" y="10" width="20" height="20" fill="#4F46E5"/>
                                                                <rect x="13" y="13" width="14" height="14" fill="white"/>
                                                                <rect x="15" y="15" width="10" height="10" fill="#4F46E5"/>
                                                                
                                                                <rect x="70" y="10" width="20" height="20" fill="#4F46E5"/>
                                                                <rect x="73" y="13" width="14" height="14" fill="white"/>
                                                                <rect x="75" y="15" width="10" height="10" fill="#4F46E5"/>
                                                                
                                                                <rect x="10" y="70" width="20" height="20" fill="#4F46E5"/>
                                                                <rect x="13" y="73" width="14" height="14" fill="white"/>
                                                                <rect x="15" y="75" width="10" height="10" fill="#4F46E5"/>
                                                                
                                                                {/* Grid blocks */}
                                                                <rect x="36" y="10" width="8" height="8" fill="#6366F1"/>
                                                                <rect x="48" y="14" width="6" height="6" fill="#4F46E5"/>
                                                                <rect x="36" y="24" width="14" height="6" fill="#0F172A"/>
                                                                <rect x="58" y="24" width="6" height="14" fill="#6366F1"/>
                                                                <rect x="10" y="36" width="14" height="8" fill="#4F46E5"/>
                                                                <rect x="28" y="36" width="8" height="8" fill="#0F172A"/>
                                                                <rect x="40" y="36" width="10" height="14" fill="#6366F1"/>
                                                                
                                                                <rect x="10" y="48" width="8" height="10" fill="#0F172A"/>
                                                                <rect x="24" y="48" width="10" height="6" fill="#4F46E5"/>
                                                                <rect x="54" y="48" width="12" height="8" fill="#0F172A"/>
                                                                <rect x="70" y="36" width="12" height="12" fill="#4F46E5"/>
                                                                <rect x="86" y="36" width="4" height="16" fill="#6366F1"/>
                                                                
                                                                <rect x="36" y="70" width="16" height="8" fill="#4F46E5"/>
                                                                <rect x="36" y="82" width="6" height="8" fill="#0F172A"/>
                                                                <rect x="46" y="82" width="14" height="8" fill="#6366F1"/>
                                                                
                                                                <rect x="70" y="64" width="12" height="12" fill="#0F172A"/>
                                                                <rect x="86" y="64" width="4" height="4" fill="#4F46E5"/>
                                                                <rect x="70" y="80" width="10" height="10" fill="#6366F1"/>
                                                                <rect x="84" y="80" width="6" height="10" fill="#4F46E5"/>
                                                            </svg>
                                                            <span style={{ fontSize: 10, color: T.text.muted, marginTop: 8, fontWeight: 600 }}>Scannez le code</span>
                                                        </div>

                                                        {/* Configuration details */}
                                                        <div>
                                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text.primary, marginBottom: 8 }}>Activation de l'authentificateur</h3>
                                                            <ol style={{ fontSize: 13, color: T.text.secondary, paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                <li>Scannez le code QR ci-contre avec votre application mobile d'authentification.</li>
                                                                <li>
                                                                    Ou saisissez la clé manuellement dans votre application : 
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                                                        <code style={{ background: '#FFF', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '6px', fontSize: 12, fontWeight: 700, color: T.colors.primary, letterSpacing: '0.05em' }}>
                                                                            JBSWY3DPEHPK3PXP
                                                                        </code>
                                                                        <button 
                                                                            onClick={copyToClipboard}
                                                                            style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: T.text.secondary }}
                                                                        >
                                                                            {isCopying ? <Check size={14} style={{ color: T.colors.success }} /> : <Copy size={14} />}
                                                                            {isCopying ? 'Copié' : 'Copier'}
                                                                        </button>
                                                                    </div>
                                                                </li>
                                                                <li>
                                                                    Saisissez le code à 6 chiffres généré par votre application :
                                                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, maxWidth: 260 }}>
                                                                        <input 
                                                                            type="text" 
                                                                            maxLength="6"
                                                                            value={verificationCode}
                                                                            onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                                                            placeholder="Ex: 123456"
                                                                            style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: 14, fontWeight: 700, textAlign: 'center', outline: 'none' }}
                                                                            className="focus:border-indigo-500"
                                                                        />
                                                                        <button 
                                                                            onClick={confirm2FaSetup}
                                                                            disabled={isVerifying2Fa || verificationCode.length !== 6}
                                                                            style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', background: T.colors.primary, color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: verificationCode.length === 6 ? 1 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                                                        >
                                                                            {isVerifying2Fa && <Loader2 className="animate-spin" size={14} />}
                                                                            Confirmer
                                                                        </button>
                                                                    </div>
                                                                </li>
                                                            </ol>

                                                            <button 
                                                                onClick={() => { setShow2FaSetup(false); setVerificationCode(''); }}
                                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.text.muted, fontSize: 12, fontWeight: 600, marginTop: 16 }}
                                                            >
                                                                Annuler la configuration
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card 3: Active Sessions / Connected Devices */}
                                    {/* TODO: Link to session termination backend service endpoints */}
                                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, marginBottom: 8 }} className="flex flex-col sm:flex-row sm:items-center">
                                            <div>
                                                <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Laptop size={18} style={{ color: T.colors.primary }} /> Sessions actives & Appareils
                                                </h2>
                                                <p style={{ fontSize: 13, color: T.text.muted, marginTop: 4 }}>
                                                    Voici la liste des appareils actuellement connectés à votre compte administrateur. Vous pouvez déconnecter les sessions non reconnues à tout moment.
                                                </p>
                                            </div>
                                            {sessions.length > 1 && (
                                                <button 
                                                    onClick={terminateAllOtherSessions}
                                                    style={{ border: `1px solid ${T.colors.danger}`, background: 'transparent', color: T.colors.danger, padding: '8px 16px', borderRadius: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                                    className="hover:bg-red-50"
                                                >
                                                    Révoquer les autres sessions
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            {sessions.length === 0 ? (
                                                <div style={{ padding: '24px 0', textAlign: 'center', color: T.text.muted, fontSize: 13 }}>
                                                    Aucune session active détectée.
                                                </div>
                                            ) : (
                                                sessions.map(session => (
                                                    <div 
                                                        key={session.id} 
                                                        style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'space-between', 
                                                            padding: '16px 20px', 
                                                            borderRadius: '16px', 
                                                            background: '#F8FAFC', 
                                                            border: '1px solid #E2E8F0',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2"
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                            <div style={{ width: 44, height: 44, borderRadius: '12px', background: session.current ? `${T.colors.primary}10` : '#EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {session.device.includes('iPhone') || session.device.includes('mobile') ? (
                                                                    <Smartphone size={20} style={{ color: session.current ? T.colors.primary : T.text.secondary }} />
                                                                ) : (
                                                                    <Laptop size={20} style={{ color: session.current ? T.colors.primary : T.text.secondary }} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>{session.device}</h3>
                                                                    {session.current && (
                                                                        <span style={{ fontSize: 10, fontWeight: 700, background: `${T.colors.success}15`, color: T.colors.success, padding: '2px 8px', borderRadius: '99px' }}>
                                                                            Session actuelle
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p style={{ fontSize: 12, color: T.text.secondary, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                                                                    <span><strong>IP :</strong> {session.ip}</span>
                                                                    <span><strong>Localisation :</strong> {session.location}</span>
                                                                    <span style={{ color: session.current ? T.colors.success : T.text.muted }}>{session.lastActive}</span>
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {!session.current && (
                                                            <button 
                                                                onClick={() => terminateSession(session.id)}
                                                                style={{ border: 'none', background: '#FFF', color: T.text.secondary, border: '1px solid #E2E8F0', padding: '8px 14px', borderRadius: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                                                className="hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                Déconnecter
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Card 4: Login History Logs */}
                                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                                        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Activity size={18} style={{ color: T.colors.primary }} /> Historique des connexions
                                        </h2>
                                        <p style={{ fontSize: 13, color: T.text.muted, marginBottom: 24 }}>
                                            Consultez les tentatives d'authentification récentes associées à vos identifiants administrateur.
                                        </p>

                                        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '14px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                                                <thead>
                                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                                        <th style={{ padding: '12px 18px', fontWeight: 700, color: T.text.secondary }}>Date / Heure</th>
                                                        <th style={{ padding: '12px 18px', fontWeight: 700, color: T.text.secondary }}>Appareil / OS</th>
                                                        <th style={{ padding: '12px 18px', fontWeight: 700, color: T.text.secondary }}>Adresse IP</th>
                                                        <th style={{ padding: '12px 18px', fontWeight: 700, color: T.text.secondary }}>Statut</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loginHistory.map(log => (
                                                        <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} className="hover:bg-slate-50">
                                                            <td style={{ padding: '14px 18px', color: T.text.primary, fontWeight: 500 }}>{log.date}</td>
                                                            <td style={{ padding: '14px 18px', color: T.text.secondary }}>{log.device}</td>
                                                            <td style={{ padding: '14px 18px', color: T.text.muted, fontFamily: 'monospace' }}>{log.ip}</td>
                                                            <td style={{ padding: '14px 18px' }}>
                                                                <span style={{ 
                                                                    fontSize: 11, 
                                                                    fontWeight: 700, 
                                                                    padding: '4px 10px', 
                                                                    borderRadius: '8px',
                                                                    background: log.status === 'Réussi' ? `${T.colors.success}10` : `${T.colors.danger}10`,
                                                                    color: log.status === 'Réussi' ? T.colors.success : T.colors.danger
                                                                }}>
                                                                    {log.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Card 5: Role-based permissions & Access Rights */}
                                    <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow }}>
                                        <div style={{ display: 'flex', gap: 20 }} className="flex flex-col sm:flex-row">
                                            <div style={{ width: 48, height: 48, borderRadius: '14px', background: `${T.colors.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <ShieldCheck size={24} style={{ color: T.colors.primary }} />
                                            </div>
                                            <div>
                                                <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text.primary, marginBottom: 6 }}>
                                                    Habilitations & Rôle : Administrateur Principal
                                                </h2>
                                                <p style={{ fontSize: 13, color: T.text.secondary, lineHeight: '1.6', marginBottom: 18 }}>
                                                    Votre compte dispose des privilèges de super-utilisateur. Ces autorisations vous permettent de maintenir l'ordre et le bon fonctionnement de la plateforme EduAI.
                                                </p>
                                                
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px 24px', marginTop: 16 }}>
                                                    {[
                                                        'Gestion & Validation des professeurs',
                                                        'Modération des cours & contenus du catalogue',
                                                        'Accès complet aux statistiques & analytics',
                                                        'Gestion des abonnements & des étudiants',
                                                        'Modération du forum & chat RAG d\'aide',
                                                        'Configurations système globales'
                                                    ].map((perm, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text.secondary, fontWeight: 500 }}>
                                                            <CheckCircle2 size={14} style={{ color: T.colors.primary, flexShrink: 0 }} />
                                                            {perm}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── SECTIONS: FALLBACKS (NOTIFICATIONS, THEME, LANGUAGE, PLATFORM) ── */}
                            {activeSection !== 'profile' && activeSection !== 'security' && (
                                <div style={{ background: T.card.bg, border: T.card.border, borderRadius: T.card.radius, padding: '32px', boxShadow: T.card.shadow, textAlign: 'center', padding: '60px 0' }}>
                                    <Settings size={48} style={{ color: '#E2E8F0', margin: '0 auto 16px' }} />
                                    <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text.primary }}>Section en construction</h2>
                                    <p style={{ fontSize: 14, color: T.text.muted, marginTop: 8 }}>Les paramètres pour cette section seront bientôt disponibles.</p>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
