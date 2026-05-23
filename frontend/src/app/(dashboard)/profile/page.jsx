'use client';
import { useEffect, useRef, useState } from 'react';
import { studentAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import UserAvatar from '@/components/ui/UserAvatar';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { useAuthStore } from '@/lib/authStore';
import {
    Mail, BookOpen, Trophy, TrendingUp, Edit3, Check, X, Loader2, Camera,
    User, Shield, Bell, Globe, LogOut, Trash2, Lock, ChevronRight, AlertTriangle,
    BellRing, BookMarked, Clock, Languages, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLangStore } from '@/lib/i18n';

function compressImage(file, maxSizeKB = 200) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const MAX_DIM = 400;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
                    else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
                }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                let quality = 0.85;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.2) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(dataUrl);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const getTabs = (t) => [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'language', label: t('settings.language'), icon: Globe },
    { id: 'account', label: t('settings.account'), icon: LogOut },
];

function DeleteModal({ open, onClose, onConfirm, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-md rounded-2xl p-6 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-elevated)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--danger-bg)' }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                    </div>
                    <div>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Supprimer le compte</h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Cette action est irréversible</p>
                    </div>
                </div>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Toutes vos données, cours, progressions et messages seront supprimés définitivement. Êtes-vous absolument sûr ?
                </p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="btn-ghost text-sm">Annuler</button>
                    <button onClick={onConfirm} disabled={loading} className="btn-danger text-sm">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Supprimer définitivement
                    </button>
                </div>
            </div>
        </div>
    );
}

function SectionCard({ title, description, icon: Icon, children }) {
    return (
        <div className="card" style={{ cursor: 'default' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}
        >
            <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                    <h3 className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                    {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

function SettingRow({ icon: Icon, label, description, children }) {
    return (
        <div className="flex items-center justify-between py-3 gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
                <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
                </div>
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuthStore();
    const { t, lang, setLang: setGlobalLang } = useLangStore();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [form, setForm] = useState({ name: '', bio: '' });
    const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [notifs, setNotifs] = useState({ email: true, courseUpdates: true, newLessons: true, reminders: false });
    const [selectedLang, setSelectedLang] = useState(lang);
    const fileInputRef = useRef(null);

    useEffect(() => {
        Promise.all([studentAPI.getProfile(), studentAPI.getStats(), studentAPI.getPreferences()])
            .then(([profRes, statsRes, prefsRes]) => {
                setProfile(profRes.data.user);
                setStats(statsRes.data.stats);
                setForm({ name: profRes.data.user.name, bio: profRes.data.user.bio || '' });
                const p = prefsRes.data.preferences;
                if (p) {
                    if (p.language) setGlobalLang(p.language);
                    if (p.notifications) setNotifs(p.notifications);
                }
            })
            .catch(() => toast.error('Erreur chargement du profil'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await studentAPI.updateProfile(form);
            setProfile(data.user);
            updateUser({ name: data.user.name, bio: data.user.bio });
            setEditing(false);
            toast.success('Profil mis à jour !');
        } catch { toast.error('Erreur lors de la mise à jour'); }
        finally { setSaving(false); }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Veuillez sélectionner une image'); return; }
        setUploadingAvatar(true);
        try {
            const dataUrl = await compressImage(file);
            const { data } = await studentAPI.uploadAvatar(dataUrl);
            setProfile(data.user);
            updateUser({ avatar: data.user.avatar });
            toast.success('Photo de profil mise à jour !');
        } catch { toast.error('Erreur lors du téléchargement'); }
        finally { setUploadingAvatar(false); e.target.value = ''; }
    };

    const handlePasswordChange = async () => {
        if (!pwForm.current.trim()) { toast.error('Veuillez entrer votre mot de passe actuel'); return; }
        if (pwForm.newPw.length < 8) { toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères'); return; }
        if (pwForm.newPw !== pwForm.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
        if (pwForm.current === pwForm.newPw) { toast.error('Le nouveau mot de passe doit être différent de l\'actuel'); return; }
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
            const msg = err.response?.data?.message || 'Erreur lors du changement de mot de passe';
            toast.error(msg);
        } finally { setPwSaving(false); }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        try {
            await studentAPI.deleteAccount();
            toast.success('Compte supprimé avec succès.');
            setTimeout(() => logout(), 1500);
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur lors de la suppression';
            toast.error(msg);
        } finally { setDeleteLoading(false); setDeleteOpen(false); }
    };

    const handleNotifsSave = async () => {
        try {
            await studentAPI.updatePreferences({ notifications: notifs });
            toast.success('Préférences de notifications mises à jour !');
        } catch { toast.error('Erreur lors de la sauvegarde'); }
    };

    const handleLangSave = async () => {
        try {
            await studentAPI.updatePreferences({ language: selectedLang });
            setGlobalLang(selectedLang);
            toast.success(t('toast.langUpdated'));
        } catch { toast.error(t('toast.saveError')); }
    };

    if (loading) return (
        <Sidebar><div className="flex justify-center py-24"><Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent)' }} /></div></Sidebar>
    );

    return (
        <Sidebar>
            <DeleteModal open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteAccount} loading={deleteLoading} />

            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('settings.title')}</h1>
                    <p className="page-subtitle">{t('settings.subtitle')}</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-5 max-w-5xl">
                {/* Tab sidebar */}
                <div className="lg:w-56 flex-shrink-0">
                    <div className="card lg:sticky lg:top-4" style={{ cursor: 'default', padding: '0.5rem' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}>
                        <nav className="space-y-0.5">
                            {getTabs(t).map(({ id, label, icon: Icon }) => (
                                <button key={id} onClick={() => setActiveTab(id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
                                    style={{
                                        background: activeTab === id ? 'var(--accent-dim)' : 'transparent',
                                        color: activeTab === id ? 'var(--accent)' : 'var(--text-secondary)',
                                        borderLeft: activeTab === id ? '3px solid var(--accent)' : '3px solid transparent',
                                    }}>
                                    <Icon className="w-4 h-4" />
                                    {label}
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-5 min-w-0">

                    {/* ── PROFILE ── */}
                    {activeTab === 'profile' && (<>
                        <SectionCard title="Photo de profil" description="Cliquez sur l'avatar pour modifier" icon={Camera}>
                            <div className="flex items-center gap-5">
                                <div className="relative group flex-shrink-0">
                                    <div className="rounded-2xl overflow-hidden w-20 h-20" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                                        <UserAvatar user={profile} size="xl" />
                                    </div>
                                    <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                                        className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                                        {uploadingAvatar ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                </div>
                                <div>
                                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile?.name}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{profile?.role === 'instructor' ? 'Professeur' : profile?.role === 'admin' ? 'Administrateur' : 'Étudiant'}</p>
                                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>JPG, PNG, WebP · Max 200 Ko</p>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Informations personnelles" description="Modifiez votre nom et biographie" icon={Edit3}>
                            {editing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="input-label">Nom complet</label>
                                        <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="input-label">Biographie</label>
                                        <textarea rows={3} className="input resize-none" placeholder="Parlez de vous..."
                                            value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                                        </button>
                                        <button onClick={() => { setForm({ name: profile.name, bio: profile.bio || '' }); setEditing(false); }} className="btn-ghost text-sm">
                                            <X className="w-4 h-4" /> Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <SettingRow icon={User} label="Nom" description={profile?.name} />
                                    <SettingRow icon={Mail} label="Email" description={profile?.email} />
                                    <SettingRow icon={Edit3} label="Bio" description={profile?.bio || 'Non renseignée'} />
                                    <SettingRow icon={Clock} label="Membre depuis"
                                        description={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }) : '—'} />
                                    <div className="pt-4">
                                        <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
                                            <Edit3 className="w-4 h-4" /> Modifier le profil
                                        </button>
                                    </div>
                                </div>
                            )}
                        </SectionCard>

                        {stats && (
                            <SectionCard title="Statistiques" description="Votre progression sur la plateforme" icon={TrendingUp}>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[
                                        { icon: BookOpen, color: 'var(--accent)', bg: 'var(--accent-dim)', value: stats.totalCourses, label: 'Cours inscrits' },
                                        { icon: Check, color: 'var(--success)', bg: 'var(--success-bg)', value: stats.completedCourses, label: 'Terminés' },
                                        { icon: TrendingUp, color: 'var(--warning)', bg: 'var(--warning-bg)', value: `${stats.averageCompletion}%`, label: 'Progression' },
                                        { icon: Trophy, color: 'var(--accent)', bg: 'var(--accent-dim)', value: `${stats.avgScore}%`, label: 'Score quiz' },
                                    ].map(({ icon: I, color, bg, value, label }) => (
                                        <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: bg }}>
                                                <I className="w-5 h-5" style={{ color }} />
                                            </div>
                                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </>)}

                    {/* ── SECURITY ── */}
                    {activeTab === 'security' && (
                        <SectionCard title="Changer le mot de passe" description="Mettez à jour votre mot de passe de connexion" icon={Lock}>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="input-label">Mot de passe actuel</label>
                                    <input type="password" className="input" placeholder="••••••••"
                                        value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
                                </div>
                                <div>
                                    <label className="input-label">Nouveau mot de passe</label>
                                    <input type="password" className="input" placeholder="Min. 6 caractères"
                                        value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} />
                                </div>
                                <div>
                                    <label className="input-label">Confirmer le mot de passe</label>
                                    <input type="password" className="input" placeholder="Retapez le mot de passe"
                                        value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
                                </div>
                                <button onClick={handlePasswordChange} disabled={pwSaving || !pwForm.current || !pwForm.newPw || !pwForm.confirm || pwForm.newPw.length < 8 || pwForm.newPw !== pwForm.confirm}
                                    className="btn-primary text-sm">
                                    {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                    Mettre à jour le mot de passe
                                </button>
                                {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                                    <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>⚠ Les mots de passe ne correspondent pas</p>
                                )}
                                {pwForm.newPw && pwForm.newPw.length > 0 && pwForm.newPw.length < 8 && (
                                    <p className="text-xs mt-2" style={{ color: 'var(--warning)' }}>⚠ Minimum 8 caractères ({pwForm.newPw.length}/8)</p>
                                )}
                            </div>
                            <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Conseils de sécurité</p>
                                <ul className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                                    <li>• Utilisez au moins 8 caractères</li>
                                    <li>• Combinez lettres, chiffres et symboles</li>
                                    <li>• Ne réutilisez pas un ancien mot de passe</li>
                                </ul>
                            </div>
                        </SectionCard>
                    )}

                    {/* ── NOTIFICATIONS ── */}
                    {activeTab === 'notifications' && (
                        <SectionCard title="Préférences de notifications" description="Choisissez les notifications que vous souhaitez recevoir" icon={BellRing}>
                            <div className="space-y-1">
                                <SettingRow icon={Mail} label="Notifications par email" description="Recevoir des notifications par email">
                                    <ToggleSwitch checked={notifs.email} onChange={v => setNotifs({ ...notifs, email: v })} />
                                </SettingRow>
                                <SettingRow icon={BookMarked} label="Mises à jour des cours" description="Nouveaux contenus dans vos cours">
                                    <ToggleSwitch checked={notifs.courseUpdates} onChange={v => setNotifs({ ...notifs, courseUpdates: v })} />
                                </SettingRow>
                                <SettingRow icon={Bell} label="Nouvelles leçons" description="Alertes quand de nouvelles leçons sont publiées">
                                    <ToggleSwitch checked={notifs.newLessons} onChange={v => setNotifs({ ...notifs, newLessons: v })} />
                                </SettingRow>
                                <SettingRow icon={Clock} label="Rappels" description="Rappels de progression et quiz à compléter">
                                    <ToggleSwitch checked={notifs.reminders} onChange={v => setNotifs({ ...notifs, reminders: v })} />
                                </SettingRow>
                            </div>
                            <div className="pt-5">
                                <button onClick={handleNotifsSave} className="btn-primary text-sm">
                                    <Save className="w-4 h-4" /> Sauvegarder les préférences
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* ── LANGUAGE ── */}
                    {activeTab === 'language' && (
                        <SectionCard title={t('settings.langTitle')} description={t('settings.langDesc')} icon={Languages}>
                            <div className="max-w-sm space-y-4">
                                <div>
                                    <label className="input-label">{t('settings.langLabel')}</label>
                                    <select className="input" value={selectedLang} onChange={e => setSelectedLang(e.target.value)}
                                        style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}>
                                        <option value="fr">🇫🇷 Français</option>
                                        <option value="en">🇬🇧 English</option>
                                    </select>
                                </div>
                                <button onClick={handleLangSave} className="btn-primary text-sm">
                                    <Globe className="w-4 h-4" /> {t('settings.langApply')}
                                </button>
                            </div>
                        </SectionCard>
                    )}

                    {/* ── ACCOUNT ── */}
                    {activeTab === 'account' && (<>
                        <SectionCard title="Déconnexion" description="Se déconnecter de votre compte" icon={LogOut}>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                Vous serez redirigé vers la page d'accueil après la déconnexion.
                            </p>
                            <button onClick={logout} className="btn-secondary text-sm">
                                <LogOut className="w-4 h-4" /> Se déconnecter
                            </button>
                        </SectionCard>

                        <div className="card" style={{ cursor: 'default', borderColor: 'var(--danger)', borderWidth: '1px' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'none'; }}>
                            <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--danger-bg)' }}>
                                    <Trash2 className="w-4.5 h-4.5" style={{ color: 'var(--danger)' }} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[15px]" style={{ color: 'var(--danger)' }}>Zone dangereuse</h3>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Actions irréversibles sur votre compte</p>
                                </div>
                            </div>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                La suppression de votre compte est permanente. Toutes vos données, progressions et messages seront perdus.
                            </p>
                            <button onClick={() => setDeleteOpen(true)} className="btn-danger text-sm">
                                <Trash2 className="w-4 h-4" /> Supprimer mon compte
                            </button>
                        </div>
                    </>)}
                </div>
            </div>
        </Sidebar>
    );
}
