'use client';

import { useState, useEffect } from 'react';
import { getKeycloak } from '@/lib/keycloak';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  ArrowRight,
  Bot,
  ClipboardList,
  TrendingUp,
  Award,
  Users,
  Star,
  MonitorPlay,
  ShieldCheck,
  BrainCircuit,
  UserPlus,
  PlayCircle,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import NetworkBackground from '@/components/ui/NetworkBackground';

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const dashboardPath = () => {
    if (!user) return '/dashboard';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'instructor') return '/instructor';
    return '/dashboard';
  };

  const go = () => {
    if (user) {
      router.push(dashboardPath());
      return;
    }
    const kc = getKeycloak();
    if (!kc) return toast.error("Service d'authentification indisponible.");
    try { kc.login({ redirectUri: window.location.origin + '/auth/callback' }); } catch { toast.error('Impossible de se connecter.'); }
  };

  const reg = () => {
    if (user) {
      router.push(dashboardPath());
      return;
    }
    const kc = getKeycloak();
    if (!kc) return toast.error("Service d'authentification indisponible.");
    try { kc.register({ redirectUri: window.location.origin + '/auth/callback' }); } catch { toast.error("Impossible de s'inscrire."); }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F8FAFC', color: '#0F172A', fontFamily: "'Inter', sans-serif" }}>
      {/* BACKGROUND PATTERN */}
      <NetworkBackground mode="light" />

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`w-full transition-all duration-300 ${scrolled ? 'backdrop-blur-xl shadow-lg border-b' : ''}`}
        style={{ backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.9)' : 'transparent', borderColor: 'rgba(0, 0, 0, 0.05)', height: '96px', padding: '0 7vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 50 }}
      >
        <div className="w-full mx-auto flex items-center justify-between">
          <Link href="/" className="group" style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 60, flexShrink: 0 }}>
            <div className="rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.2)] group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all" style={{ width: '56px', height: '56px', flexShrink: 0, background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
              <GraduationCap className="w-6 h-6" style={{ color: '#FFFFFF' }} />
            </div>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '28px', fontWeight: 900, lineHeight: 1, color: '#0F172A', whiteSpace: 'nowrap', position: 'static', transform: 'none' }}>
              Edu<span style={{ color: '#4F46E5' }}>AI</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {['Fonctionnalités', 'Cours', 'Témoignages', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={(e) => scrollToSection(e, item.toLowerCase())} className="text-[16px] font-bold transition-colors" style={{ color: '#475569' }} onMouseEnter={(e) => e.target.style.color = '#4F46E5'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <button onClick={go} className="text-[16px] font-bold transition-colors" style={{ color: '#0F172A' }} onMouseEnter={(e) => e.target.style.color = '#4F46E5'} onMouseLeave={(e) => e.target.style.color = '#0F172A'}>
              Connexion
            </button>
            <button onClick={reg} className="text-[16px] font-bold px-8 py-3.5 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all" style={{ backgroundColor: '#4F46E5', color: '#FFFFFF' }}>
              Rejoindre
            </button>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative flex items-center z-10" id="accueil" style={{ paddingTop: '70px', minHeight: 'calc(100vh - 90px)' }}>
        <div className="max-w-[1400px] w-full mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center" style={{ transform: 'translateY(-35px)' }}>
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[15px] font-bold tracking-wide border backdrop-blur-md" style={{ borderColor: 'rgba(79, 70, 229, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#4F46E5', marginTop: 0, marginBottom: '50px', position: 'relative', zIndex: 1 }}>
              <BrainCircuit className="w-5 h-5" /> E-Learning Professionnel
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-[900] mb-8 max-w-[700px]" style={{ fontSize: 'clamp(2.8rem, 6vw, 5.5rem)', lineHeight: 1.05, letterSpacing: '-2px', color: '#0F172A' }}>
              Votre apprentissage, <br />
              <span style={{ color: '#4F46E5', textShadow: '0 0 30px rgba(79, 70, 229, 0.4)' }}>plus simple et plus intelligent.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[1.1rem] leading-[1.8] mb-10 max-w-xl" style={{ color: '#475569' }}>
              Une plateforme e-learning intelligente qui vous accompagne dans votre progression grâce à des cours interactifs et un tuteur IA disponible à tout moment.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
              <button onClick={reg} className="inline-flex items-center gap-3 font-[800] px-10 py-5 rounded-full text-[1.1rem] shadow-[0_0_25px_rgba(79,70,229,0.3)] hover:shadow-[0_0_45px_rgba(79,70,229,0.5)] hover:-translate-y-1 transition-all" style={{ backgroundColor: '#4F46E5', color: '#FFFFFF' }}>
                Commencer <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative w-[550px] h-[550px] mx-auto">
              {/* Circular Background */}
              <div className="absolute inset-0 rounded-full blur-[60px] opacity-30" style={{ backgroundColor: '#6366F1' }} />
              <div className="absolute inset-4 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.05))', border: '1px solid rgba(79, 70, 229, 0.2)' }} />

              <img src="/images/hero-student.png" alt="Student studying" className="absolute inset-0 w-full h-full object-cover rounded-full p-4" onError={(e) => e.target.style.display = 'none'} />

              {/* Floating Cards */}
              <motion.div animate={{ y: [-12, 12, -12] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-12 -left-12 p-5 rounded-[24px] flex items-center gap-5 shadow-[0_15px_40px_rgba(0,0,0,0.6)]" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(79,70,229,0.15)', backdropFilter: 'blur(14px)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: 'rgba(79, 70, 229, 0.15)', color: '#4F46E5' }}>
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-[800] text-[1.2rem]" style={{ color: '#0F172A' }}>Tuteur IA</p>
                  <p className="text-[15px] font-[600]" style={{ color: '#64748B' }}>Toujours disponible</p>
                </div>
              </motion.div>

              <motion.div animate={{ y: [12, -12, 12] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-24 -right-12 p-5 rounded-[24px] flex items-center gap-5 shadow-[0_15px_40px_rgba(0,0,0,0.6)]" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(79,70,229,0.15)', backdropFilter: 'blur(14px)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-[800] text-[1.2rem]" style={{ color: '#0F172A' }}>Professeurs qualifiés</p>
                  <p className="text-[15px] font-[600]" style={{ color: '#64748B' }}>Experts de confiance</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. FONCTIONNALITES */}
      <section id="fonctionnalités" className="relative z-10" style={{ padding: '110px 8%', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-[1450px] mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h2 className="text-[3rem] font-[800] leading-tight mb-8" style={{ color: '#0F172A' }}>
              Des fonctionnalités pensées pour <span style={{ color: '#4F46E5' }}>apprendre mieux</span>
            </h2>
            <p className="text-[1.1rem] leading-[1.8]" style={{ color: '#475569' }}>
              Une plateforme moderne qui combine intelligence artificielle, accompagnement personnalisé et expérience d’apprentissage interactive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[28px]">
            {[
              { badge: 'IA', icon: Bot, title: 'Tuteur IA intelligent', desc: 'Posez vos questions et recevez des explications personnalisées basées sur vos cours.' },
              { badge: 'Quiz', icon: ClipboardList, title: 'Quiz adaptatifs', desc: 'Testez vos connaissances avec des quiz générés selon votre niveau et votre progression.' },
              { badge: 'Progression', icon: TrendingUp, title: 'Suivi des progrès', desc: 'Analysez votre évolution, vos résultats et vos points à améliorer.' },
              { badge: 'Certificat', icon: Award, title: 'Certifications', desc: 'Valorisez vos compétences avec des certificats après validation de vos apprentissages.' }
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group relative transition-all duration-300 flex flex-col justify-between" style={{ background: '#FFFFFF', border: '1px solid rgba(79,70,229,0.18)', borderRadius: '28px', padding: '34px', boxShadow: '0 22px 55px rgba(0,0,0,0.25)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.45)'; e.currentTarget.style.boxShadow = '0 28px 70px rgba(79, 70, 229, 0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.18)'; e.currentTarget.style.boxShadow = '0 22px 55px rgba(0,0,0,0.25)'; }}>
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-shadow" style={{ backgroundColor: 'rgba(79, 70, 229, 0.15)', color: '#4F46E5' }}>
                      <f.icon className="w-8 h-8" />
                    </div>
                    <span className="text-[12px] font-[800] px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(79, 70, 229, 0.12)', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.badge}</span>
                  </div>
                  <h3 className="text-[1.3rem] font-[800] mb-4" style={{ color: '#0F172A' }}>{f.title}</h3>
                  <p className="text-[1.05rem] leading-[1.7] mb-8" style={{ color: '#475569' }}>{f.desc}</p>
                </div>
                <div className="pt-6 mt-auto border-t" style={{ borderColor: 'rgba(79, 70, 229, 0.1)' }}>
                  <button onClick={go} className="flex items-center gap-2 text-[15px] font-[700] transition-colors group-hover:gap-3" style={{ color: '#4F46E5' }}>
                    Découvrir <ArrowRight className="w-4 h-4 transition-all" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. COURS */}
      <section id="cours" className="relative z-10" style={{ padding: '100px 8%' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-3xl">
              <h2 className="text-[3rem] font-[800] leading-tight mb-6" style={{ color: '#0F172A' }}>
                Explorez nos <span style={{ color: '#4F46E5' }}>cours populaires</span>
              </h2>
              <p className="text-[1.1rem] leading-[1.8]" style={{ color: '#475569' }}>Découvrez des formations modernes conçues pour développer vos compétences avec l’aide de l’intelligence artificielle.</p>
            </div>
            <button onClick={go} className="inline-flex items-center gap-3 font-[800] text-[1.1rem] transition-colors" style={{ color: '#4F46E5' }}>
              Voir tout <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Intelligence Artificielle', level: 'Avancé', students: '2.5k', desc: 'Apprenez à concevoir et entraîner des modèles d\'IA de pointe.', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80' },
              { title: 'Développement Web', level: 'Débutant', students: '4.1k', desc: 'Maîtrisez la création d\'applications web full-stack modernes.', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80' },
              { title: 'Data Science', level: 'Intermédiaire', students: '3.2k', desc: 'Découvrez comment analyser et visualiser des données complexes.', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80' },
              { title: 'Cybersécurité', level: 'Avancé', students: '1.8k', desc: 'Sécurisez les infrastructures contre les vulnérabilités réseau.', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80' }
            ].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group relative transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:-translate-y-2" style={{ background: '#FFFFFF', border: '1px solid rgba(79, 70, 229, 0.18)', borderRadius: '28px', padding: '18px' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.6)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.18)'; }}>
                <div className="relative w-full h-[190px] mb-[22px] overflow-hidden" style={{ borderRadius: '22px' }}>
                  <img src={c.image} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.95) 0%, transparent 60%)' }}></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] font-[800] px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(79, 70, 229, 0.15)', color: '#4F46E5' }}>{c.level}</span>
                    <div className="flex items-center gap-1.5 text-[14px] font-[700]" style={{ color: '#64748B' }}>
                      <Users className="w-4 h-4" /> {c.students}
                    </div>
                  </div>
                  <h3 className="text-[1.2rem] font-[800] mb-2 group-hover:text-[#4F46E5] transition-colors" style={{ color: '#0F172A' }}>{c.title}</h3>
                  <p className="text-[0.95rem] leading-[1.6] mb-6" style={{ color: '#64748B' }}>{c.desc}</p>
                  <button onClick={go} className="w-full py-3.5 rounded-xl font-[800] text-[1.05rem] transition-all border" style={{ backgroundColor: 'transparent', borderColor: 'rgba(79, 70, 229, 0.3)', color: '#4F46E5' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#4F46E5'; e.target.style.color = '#FFFFFF' }} onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#4F46E5' }}>
                    Voir le cours
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COMMENT CA MARCHE */}
      <section className="py-32 relative z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-4xl mx-auto mb-24">
            <h2 className="text-[3rem] font-[800] leading-tight mb-6" style={{ color: '#0F172A' }}>
              Comment ça <span style={{ color: '#4F46E5' }}>marche</span> ?
            </h2>
            <p className="text-[1.1rem] leading-[1.8]" style={{ color: '#475569' }}>Quatre étapes simples pour transformer votre façon d'apprendre.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-[3px] border-t-4 border-dashed z-0" style={{ borderColor: 'rgba(79, 70, 229, 0.2)' }}></div>

            {[
              { num: '01', title: 'Créez votre compte', icon: UserPlus },
              { num: '02', title: 'Choisissez un cours', icon: PlayCircle },
              { num: '03', title: 'Apprenez avec le Tuteur IA', icon: MessageSquare },
              { num: '04', title: 'Suivez vos progrès', icon: TrendingUp }
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center z-10 group">
                <div className="w-32 h-32 rounded-full flex flex-col items-center justify-center mb-8 shadow-[0_0_30px_rgba(79,70,229,0.1)] transition-transform group-hover:scale-105" style={{ backgroundColor: '#FFFFFF', border: '3px solid rgba(79, 70, 229, 0.1)', backdropFilter: 'blur(10px)' }}>
                  <span className="font-[900] text-[2rem] leading-none mb-1" style={{ color: '#6366F1' }}>{s.num}</span>
                  <s.icon className="w-8 h-8" style={{ color: '#4F46E5' }} />
                </div>
                <h3 className="text-[1.2rem] font-[700] px-4" style={{ color: '#0F172A' }}>{s.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. TEMOIGNAGES */}
      <section id="témoignages" className="py-32 relative z-10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="text-center max-w-4xl mx-auto mb-20">
            <h2 className="text-[3rem] font-[800] leading-tight mb-6" style={{ color: '#0F172A' }}>
              Ils apprennent avec <span style={{ color: '#4F46E5' }}>EduAI</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah M.', text: '"L\'assistant IA m\'a permis de comprendre des concepts algorithmiques complexes en quelques minutes. Une plateforme exceptionnelle !"' },
              { name: 'Julien T.', text: '"Les quiz adaptatifs m\'ont beaucoup aidé pour préparer mes certifications. L\'interface est fluide et super professionnelle."' },
              { name: 'Amira B.', text: '"Enfin une plateforme où on se sent accompagné ! Le suivi des progrès me motive chaque jour à continuer mes formations."' }
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-[32px] p-10 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]" style={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(79,70,229,0.15)', backdropFilter: 'blur(14px)' }}>
                <Quote className="w-12 h-12 absolute top-8 right-8 opacity-20" style={{ color: '#4F46E5' }} />
                <div className="flex gap-1.5 mb-8">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-6 h-6 fill-current" style={{ color: '#4F46E5' }} />
                  ))}
                </div>
                <p className="text-[1.1rem] leading-[1.8] mb-10 italic font-[500]" style={{ color: '#475569' }}>{t.text}</p>
                <div className="flex items-center gap-5 border-t pt-6" style={{ borderColor: 'rgba(79, 70, 229, 0.15)' }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-[900] text-[1.2rem]" style={{ backgroundColor: '#4F46E5', color: '#FFFFFF' }}>
                    {t.name.charAt(0)}
                  </div>
                  <span className="font-[800] text-[1.2rem]" style={{ color: '#0F172A' }}>{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-32 relative z-10">
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="rounded-[40px] p-14 md:p-20 text-center relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.05)]" style={{ background: '#FFFFFF', border: '2px solid rgba(79,70,229,0.15)', backdropFilter: 'blur(20px)' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.5) 0%, transparent 70%)' }}></div>
            <h2 className="text-[3rem] font-[800] leading-tight mb-8 relative z-10" style={{ color: '#0F172A' }}>
              Prêt à apprendre avec <span style={{ color: '#4F46E5' }}>intelligence</span> ?
            </h2>
            <p className="text-[1.1rem] leading-[1.8] mb-12 max-w-2xl mx-auto relative z-10" style={{ color: '#475569' }}>
              Rejoignez des milliers d'étudiants sur EduAI et commencez votre parcours vers la réussite dès aujourd’hui.
            </p>
            <button onClick={reg} className="inline-flex items-center gap-4 font-[900] px-12 py-5 rounded-full text-[1.2rem] shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)] transition-all relative z-10 hover:-translate-y-1" style={{ backgroundColor: '#4F46E5', color: '#FFFFFF' }}>
              Commencer maintenant <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer id="contact" className="pt-24 pb-12 border-t relative z-10" style={{ backgroundColor: '#F8FAFC', borderColor: 'rgba(79, 70, 229, 0.15)' }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5">
              <Link href="/" className="flex items-center gap-4 mb-8 inline-flex">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)' }}>
                  <GraduationCap className="w-6 h-6" style={{ color: '#FFFFFF' }} />
                </div>
                <span className="font-[900] text-[24px] tracking-tight" style={{ color: '#0F172A' }}>
                  Edu<span style={{ color: '#4F46E5' }}>AI</span>
                </span>
              </Link>
              <p className="text-[1.1rem] leading-[1.8] max-w-md" style={{ color: '#64748B' }}>
                EduAI est une plateforme e-learning innovante propulsée par l'intelligence artificielle pour un apprentissage personnalisé et professionnel.
              </p>
            </div>

            <div className="md:col-span-3">
              <h4 className="font-[800] text-[1.2rem] mb-8" style={{ color: '#0F172A' }}>Liens rapides</h4>
              <ul className="space-y-5">
                {['Fonctionnalités', 'Cours', 'Témoignages', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} onClick={(e) => scrollToSection(e, item.toLowerCase())} className="text-[1.1rem] font-[600] transition-colors" style={{ color: '#64748B' }} onMouseEnter={(e) => e.target.style.color = '#4F46E5'} onMouseLeave={(e) => e.target.style.color = '#64748B'}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="font-[800] text-[1.2rem] mb-8" style={{ color: '#0F172A' }}>Nous contacter</h4>
              <ul className="space-y-5 text-[1.1rem] font-[600]" style={{ color: '#64748B' }}>
                <li>Email : contact@eduai.com</li>
                <li>Support : aide.eduai.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-10 flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderColor: 'rgba(79, 70, 229, 0.15)' }}>
            <p className="text-[15px] font-[600]" style={{ color: '#64748B' }}>
              © {new Date().getFullYear()} EduAI. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Quote(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}
