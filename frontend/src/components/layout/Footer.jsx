'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, Github, Linkedin, Twitter } from 'lucide-react';
import { getKeycloak } from '@/lib/keycloak';
import { useThemeStore } from '@/lib/themeStore';



const LINKS = [
    { label: 'Fonctionnalités', href: '/#fonctionnalités' },
    { label: 'Contact', href: '/contact' },
    { label: 'Confidentialité', href: '/privacy' },
    { label: 'Conditions', href: '/terms' },
];

const SOCIALS = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Github, href: '#', label: 'GitHub' },
];

export default function Footer() {
    const { isLightMode } = useThemeStore();
    const Y = isLightMode ? '#059669' : '#D4E157';
    const G = '#0B3D2E';
    const bgMain = isLightMode ? '#EEF2F0' : G;
    const borderMain = isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    const textMuted = isLightMode ? '#6B7280' : 'rgba(255,255,255,0.5)';
    
    const login = () => {
        const kc = getKeycloak();
        if (kc?.authenticated) return;
        kc?.login();
    };

    return (
        <footer style={{ background: bgMain, borderTop: `1px solid ${borderMain}` }}>
            {/* CTA Banner */}
            <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="py-4 px-6" style={{ background: Y }}>
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <motion.p initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        transition={{ delay: 0.1 }} className="font-black text-sm" style={{ color: isLightMode ? '#ffffff' : G }}>
                        Les inscriptions sont ouvertes pour la prochaine session
                    </motion.p>
                    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} onClick={login}
                        className="inline-flex items-center gap-2 font-bold px-4 py-1.5 rounded-full text-xs"
                        style={{ background: G, color: isLightMode ? '#ffffff' : Y }}>
                        S&apos;inscrire <ArrowRight className="w-3.5 h-3.5" />
                    </motion.button>
                </div>
            </motion.section>

            {/* Bottom bar */}
            <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                    <motion.div whileHover={{ rotate: 15, scale: 1.1 }} transition={{ type: 'spring', stiffness: 300 }}
                        className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: Y }}>
                        <GraduationCap className="w-3.5 h-3.5" style={{ color: isLightMode ? '#ffffff' : G }} />
                    </motion.div>
                    <span className="text-sm" style={{ color: textMuted }}>© {new Date().getFullYear()} EduAI</span>
                </div>

                <div className="flex items-center gap-5">
                    {LINKS.map(({ label, href }, i) => (
                        <motion.div key={label} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ delay: 0.1 + i * 0.05 }}>
                            <Link href={href} className="text-xs transition-colors hover:opacity-100 opacity-80" style={{ color: textMuted }}>{label}</Link>
                        </motion.div>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {SOCIALS.map(({ icon: Icon, href, label }, i) => (
                        <motion.a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
                            initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                            transition={{ delay: 0.2 + i * 0.08, type: 'spring' }}
                            whileHover={{ scale: 1.2, y: -2 }}
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-100 opacity-80"
                            style={{ color: textMuted, border: `1px solid ${borderMain}` }}>
                            <Icon className="w-3 h-3" />
                        </motion.a>
                    ))}
                </div>
            </motion.div>
        </footer>
    );
}
