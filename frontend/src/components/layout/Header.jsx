'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getKeycloak } from '@/lib/keycloak';
import { useAuthStore } from '@/lib/authStore';
import { useThemeStore } from '@/lib/themeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';



const NAV_LINKS = [
    { label: 'Fonctionnalités', href: '/#fonctionnalités' },
    { label: 'Cours', href: '/#cours' },
    { label: 'Témoignages', href: '/#témoignages' },
    { label: 'Contact', href: '/contact' },
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuthStore();
    const { isLightMode, toggleLightMode } = useThemeStore();
    const Y = isLightMode ? '#059669' : '#D4E157';
    const G = '#0B3D2E';
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isHomePage = pathname === '/';

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const login = () => {
        // If already logged in, go to dashboard
        if (user) {
            const dest = user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/dashboard';
            router.push(dest);
            return;
        }
        const kc = getKeycloak();
        if (!kc) {
            toast.error('Service d\'authentification indisponible. Veuillez démarrer Keycloak (Docker).');
            return;
        }
        if (kc.authenticated) return;
        try {
            kc.login({ redirectUri: window.location.origin + '/auth/callback' });
        } catch (err) {
            console.error('Login error:', err);
            toast.error('Impossible de se connecter. Vérifiez que Keycloak est démarré.');
        }
    };

    const register = () => {
        // If already logged in, go to dashboard
        if (user) {
            const dest = user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/dashboard';
            router.push(dest);
            return;
        }
        const kc = getKeycloak();
        if (!kc) {
            toast.error('Service d\'authentification indisponible. Veuillez démarrer Keycloak (Docker).');
            return;
        }
        if (kc.authenticated) return;
        try {
            kc.register({ redirectUri: window.location.origin + '/auth/callback' });
        } catch (err) {
            console.error('Register error:', err);
            toast.error('Impossible de s\'inscrire. Vérifiez que Keycloak est démarré.');
        }
    };

    const navBg = isLightMode 
        ? (scrolled ? 'rgba(238,242,240,0.95)' : 'rgba(238,242,240,0.85)')
        : (scrolled ? 'rgba(11,61,46,0.95)' : 'rgba(11,61,46,0.85)');
    const navBorder = isLightMode
        ? (scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none')
        : (scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none');
    const textMain = isLightMode ? '#111827' : 'white';
    const textMuted = isLightMode ? '#4B5563' : 'rgba(255,255,255,0.6)';

    return (
        <>
            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
                style={{
                    background: navBg,
                    backdropFilter: 'blur(16px)',
                    borderBottom: navBorder,
                }}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-md group-hover:scale-105 transition-transform" style={{ background: Y }}>
                            <GraduationCap className="w-5 h-5" style={{ color: isLightMode ? '#ffffff' : G }} />
                        </div>
                        <span className="font-extrabold text-lg tracking-tight" style={{ color: textMain }}>EduAI</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map(({ label, href }) => {
                            const isActive = pathname === href || (href.startsWith('/#') && pathname === '/');
                            return (
                                <Link key={label} href={href}
                                    className={`text-[13px] font-medium transition-colors`}
                                    style={{ color: isActive ? textMain : textMuted }}>
                                    {label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-2">
                        {user && !isHomePage ? (
                            <Link href={user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/dashboard'}
                                className="text-sm font-bold px-5 py-2.5 rounded-full shadow-lg inline-flex items-center gap-2"
                                style={{ background: Y, color: isLightMode ? '#ffffff' : G }}>
                                Mon espace <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <button onClick={login} className="text-sm font-semibold px-3 py-2 transition-colors" style={{ color: textMuted }}>Connexion</button>
                                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                    onClick={register} className="text-sm font-bold px-5 py-2.5 rounded-full shadow-lg ml-2"
                                    style={{ background: Y, color: isLightMode ? '#ffffff' : G }}>
                                    S'inscrire
                                </motion.button>
                            </>
                        )}
                        <button onClick={toggleLightMode} className="ml-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: textMain }}>
                            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Mobile toggle */}
                    <div className="md:hidden flex items-center gap-4">
                        <button onClick={toggleLightMode} className="p-2 rounded-full" style={{ color: textMain }}>
                            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <button className="" style={{ color: textMain }} onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed top-16 left-0 right-0 z-40 border-b md:hidden"
                        style={{ 
                            background: isLightMode ? 'rgba(255,255,255,0.98)' : 'rgba(11,61,46,0.98)', 
                            backdropFilter: 'blur(16px)',
                            borderColor: isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
                        }}
                    >
                        <div className="px-6 py-4 space-y-1">
                            {NAV_LINKS.map(({ label, href }) => (
                                <Link key={label} href={href} onClick={() => setMobileOpen(false)}
                                    className="block text-sm font-medium py-2.5 transition-colors"
                                    style={{ color: textMuted }}>
                                    {label}
                                </Link>
                            ))}
                            <div className="pt-3 mt-2 flex flex-col gap-2" style={{ borderTop: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}` }}>
                                {user && !isHomePage ? (
                                    <Link href={user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/dashboard'} onClick={() => setMobileOpen(false)}
                                        className="text-sm font-bold px-5 py-2.5 rounded-full text-center"
                                        style={{ background: Y, color: isLightMode ? '#ffffff' : G }}>Mon espace</Link>
                                ) : (
                                    <>
                                        <button onClick={() => { login(); setMobileOpen(false); }}
                                            className="text-sm font-semibold py-2" style={{ color: textMuted }}>Connexion</button>
                                        <button onClick={() => { register(); setMobileOpen(false); }}
                                            className="text-sm font-bold px-5 py-2.5 rounded-full"
                                            style={{ background: Y, color: isLightMode ? '#ffffff' : G }}>S'inscrire</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

