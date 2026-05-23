'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send, ArrowLeft, MapPin, CheckCircle2, Phone, Clock, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useThemeStore } from '@/lib/themeStore';

const fade = (d = 0) => ({ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { delay: d * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] } } });

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    const { isLightMode } = useThemeStore();

    useEffect(() => setMounted(true), []);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await new Promise((r) => setTimeout(r, 1200));
        setSent(true);
        setLoading(false);
    };

    const Y = isLightMode ? '#059669' : '#D4E157';
    const G = '#0B3D2E';
    const accentSoft = isLightMode ? 'rgba(5,150,105,0.12)' : 'rgba(212,225,87,0.12)';
    const bgMain = isLightMode ? 'linear-gradient(135deg, #EEF2F0 0%, #E2E8E5 50%, #D1D8D4 100%)' : '#060e0a';
    const textMain = isLightMode ? '#111827' : 'white';
    const textMuted = isLightMode ? '#4B5563' : 'rgba(255,255,255,0.5)';
    const textLight = isLightMode ? '#6B7280' : 'rgba(255,255,255,0.4)';
    const borderMain = isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
    const borderHover = isLightMode ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)';
    const cardBg = isLightMode ? '#FFFFFF' : 'rgba(255,255,255,0.03)';
    const inputBg = isLightMode ? '#FFFFFF' : 'rgba(255,255,255,0.04)';
    const orb1 = isLightMode ? '#F0FDF4' : '#0d4a30';
    const orb2 = isLightMode ? '#ECFDF5' : '#1a6b42';

    const inputClasses = "w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none transition-all duration-300";
    const inputStyle = {
        background: inputBg,
        border: `1.5px solid ${borderMain}`,
        color: textMain,
    };
    const inputFocus = (e) => {
        e.target.style.borderColor = Y;
        e.target.style.boxShadow = `0 0 0 3px ${accentSoft}`;
    };
    const inputBlur = (e) => {
        e.target.style.borderColor = borderMain;
        e.target.style.boxShadow = 'none';
    };

    const INFO_CARDS = [
        { icon: Mail, title: 'Email', desc: 'Réponse sous 24h.', detail: 'contact@eduai.com', href: 'mailto:contact@eduai.com' },
        { icon: MapPin, title: 'Localisation', desc: 'Siège principal', detail: 'Tunisie', href: null },
        { icon: Clock, title: 'Horaires', desc: 'Lun – Ven', detail: '9h – 18h', href: null },
    ];

    if (!mounted) return null;

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ background: bgMain, position: 'relative' }}>

            {/* Animated Background Orbs */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', width: 600, height: 600, top: '-15%', left: '-10%', background: orb1, borderRadius: '50%', filter: 'blur(120px)', opacity: 0.5, animation: 'drift 20s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', width: 500, height: 500, bottom: '-10%', right: '-10%', background: orb2, borderRadius: '50%', filter: 'blur(120px)', opacity: 0.3, animation: 'drift 25s ease-in-out infinite reverse' }} />
                <div style={{ position: 'absolute', width: 300, height: 300, top: '40%', left: '50%', background: Y, borderRadius: '50%', filter: 'blur(120px)', opacity: 0.04, animation: 'drift 18s ease-in-out infinite 5s' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${borderMain} 1px, transparent 1px), linear-gradient(90deg, ${borderMain} 1px, transparent 1px)`, backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)', WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black, transparent)' }} />
            </div>
            <style>{`@keyframes drift{0%,100%{transform:translate(0,0)}25%{transform:translate(30px,-20px)}50%{transform:translate(-20px,30px)}75%{transform:translate(20px,20px)}}`}</style>

            <div style={{ position: 'relative', zIndex: 1 }}>
                <Header />

                {/* Hero Section */}
                <section className="pt-24 pb-8">
                    <div className="max-w-5xl mx-auto px-6">
                        <motion.div variants={fade(0)} initial="hidden" animate="visible">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors"
                                style={{ color: textLight }}
                                onMouseEnter={e => e.currentTarget.style.color = Y}
                                onMouseLeave={e => e.currentTarget.style.color = textLight}
                            >
                                <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                            </Link>
                        </motion.div>

                        <motion.div variants={fade(1)} initial="hidden" animate="visible" className="text-center mb-14">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5" style={{ background: accentSoft, color: Y }}>
                                <Sparkles className="w-3.5 h-3.5" /> Nous contacter
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4" style={{ color: textMain }}>
                                Comment pouvons-nous <span style={{ color: Y }}>vous aider</span> ?
                            </h1>
                            <p className="text-base max-w-lg mx-auto" style={{ color: textMuted }}>
                                Notre équipe est à votre écoute pour toute question, suggestion ou demande de partenariat.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Info Cards */}
                <section className="pb-8">
                    <div className="max-w-5xl mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                            {INFO_CARDS.map(({ icon: Icon, title, desc, detail, href }, i) => (
                                <motion.div
                                    key={title}
                                    initial={{ opacity: 0, y: 25 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                    className={`rounded-2xl p-6 border transition-all relative overflow-hidden group cursor-pointer ${isLightMode ? 'shadow-lg hover:shadow-xl' : ''}`}
                                    style={{ background: cardBg, borderColor: borderMain }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = borderHover}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = borderMain}
                                >
                                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity"
                                        style={{ background: `radial-gradient(circle, ${Y}, transparent)` }} />
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                                            style={{ background: accentSoft }}>
                                            <Icon className="w-5 h-5" style={{ color: Y }} />
                                        </div>
                                        <h3 className="font-bold text-sm mb-1" style={{ color: textMain }}>{title}</h3>
                                        <p className="text-xs mb-3" style={{ color: textMuted }}>{desc}</p>
                                        {href ? (
                                            <a href={href} className="text-sm font-semibold transition-colors" style={{ color: Y }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                            >{detail}</a>
                                        ) : (
                                            <p className="text-sm font-semibold" style={{ color: Y }}>{detail}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact Form */}
                <section className="pb-20">
                    <div className="max-w-3xl mx-auto px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className={`rounded-3xl p-8 sm:p-10 border relative overflow-hidden ${isLightMode ? 'shadow-2xl' : ''}`}
                            style={{
                                background: cardBg,
                                borderColor: borderMain,
                                ...(isLightMode ? {} : {
                                    backdropFilter: 'blur(40px)',
                                    WebkitBackdropFilter: 'blur(40px)',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 80px rgba(212,225,87,0.03)',
                                })
                            }}
                        >
                            {/* Decorative glow */}
                            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10 pointer-events-none"
                                style={{ background: `radial-gradient(circle, ${Y}, transparent)` }} />

                            {sent ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-12 gap-5 text-center relative"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                                        className="w-20 h-20 rounded-3xl flex items-center justify-center"
                                        style={{ background: Y }}
                                    >
                                        <CheckCircle2 className="w-10 h-10" style={{ color: isLightMode ? '#ffffff' : G }} />
                                    </motion.div>
                                    <h3 className="text-2xl font-black" style={{ color: textMain }}>Message envoyé !</h3>
                                    <p className="text-sm max-w-sm" style={{ color: textMuted }}>
                                        Merci de nous avoir contactés. Notre équipe vous répondra dans les 24 heures.
                                    </p>
                                    <button
                                        onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                                        className="mt-2 inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm transition-all"
                                        style={{ background: accentSoft, color: Y, border: `1px solid ${Y}30` }}
                                        onMouseEnter={e => { e.currentTarget.style.background = Y; e.currentTarget.style.color = isLightMode ? '#ffffff' : G; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = accentSoft; e.currentTarget.style.color = Y; }}
                                    >
                                        Envoyer un autre message
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5 relative">
                                    <div className="mb-6">
                                        <h2 className="text-xl font-black flex items-center gap-3" style={{ color: textMain }}>
                                            <MessageSquare className="w-5 h-5" style={{ color: Y }} />
                                            Envoyez-nous un message
                                        </h2>
                                        <p className="text-sm mt-1.5 ml-8" style={{ color: textMuted }}>Remplissez le formulaire et nous reviendrons vers vous rapidement.</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: textMuted }}>Nom complet</label>
                                            <input
                                                type="text" name="name" value={form.name} onChange={handleChange} required
                                                placeholder="Votre nom"
                                                className={inputClasses} style={inputStyle}
                                                onFocus={inputFocus} onBlur={inputBlur}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: textMuted }}>Email</label>
                                            <input
                                                type="email" name="email" value={form.email} onChange={handleChange} required
                                                placeholder="email@exemple.com"
                                                className={inputClasses} style={inputStyle}
                                                onFocus={inputFocus} onBlur={inputBlur}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: textMuted }}>Sujet</label>
                                        <input
                                            type="text" name="subject" value={form.subject} onChange={handleChange} required
                                            placeholder="De quoi s'agit-il ?"
                                            className={inputClasses} style={inputStyle}
                                            onFocus={inputFocus} onBlur={inputBlur}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: textMuted }}>Message</label>
                                        <textarea
                                            name="message" value={form.message} onChange={handleChange} required rows={5}
                                            placeholder="Décrivez votre demande..."
                                            className={`${inputClasses} resize-none`} style={inputStyle}
                                            onFocus={inputFocus} onBlur={inputBlur}
                                        />
                                    </div>

                                    <motion.button
                                        type="submit" disabled={loading}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-[15px] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                        style={{
                                            background: Y, color: isLightMode ? '#ffffff' : G,
                                            boxShadow: isLightMode ? '0 8px 30px rgba(5,150,105,0.25)' : '0 8px 30px rgba(212,225,87,0.25)',
                                        }}
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: isLightMode ? '#ffffff40' : `${G}40`, borderTopColor: isLightMode ? '#ffffff' : G }} />
                                                Envoi en cours...
                                            </span>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Envoyer le message
                                            </>
                                        )}
                                    </motion.button>

                                    <p className="text-center text-[11px] mt-3" style={{ color: textLight }}>
                                        Vos données de contact sont utilisées uniquement pour répondre à votre demande.{' '}
                                        <Link href="/privacy" className="transition-colors" style={{ color: Y }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >Politique de confidentialité</Link>
                                    </p>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </section>

                <Footer />
            </div>
        </div>
    );
}

