'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import {
    BookOpen, Users, Clock, CheckCircle, MessageSquare, Brain,
    Play, ArrowRight, Loader2, ArrowLeft, Star, Mail, Sparkles,
    ChevronRight, TrendingUp, Lock
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const GraduationIllustration = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full max-h-[160px] md:max-h-[220px]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="book-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="book-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
            <linearGradient id="book-indigo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#6366f1" floodOpacity="0.15" />
            </filter>
        </defs>

        {/* Soft Background blob */}
        <path d="M120 70C240 40 340 90 360 160C380 230 300 280 200 280C100 280 40 220 50 160C60 100 0 100 120 70Z" fill="#f5f3ff" />

        <g filter="url(#shadow)">
            {/* Book 1 (Bottom - Pink) */}
            <path d="M110 210L270 235L290 205L130 180L110 210Z" fill="url(#book-pink)" />
            <path d="M130 180L290 205L285 212L125 187L130 180Z" fill="#fbcfe8" />
            <path d="M110 210L125 187L125 194L110 217L110 210Z" fill="#db2777" />

            {/* Book 2 (Middle - Purple) */}
            <path d="M115 180L275 200L295 170L135 150L115 180Z" fill="url(#book-purple)" />
            <path d="M135 150L295 170L290 176L130 156L135 150Z" fill="#c7d2fe" />
            <path d="M115 180L130 156L130 163L115 187L115 180Z" fill="#4f46e5" />

            {/* Book 3 (Top - Violet) */}
            <path d="M120 150L280 165L300 135L140 120L120 150Z" fill="url(#book-indigo)" />
            <path d="M140 120L300 135L295 141L135 126L140 120Z" fill="#ddd6fe" />
            <path d="M120 150L135 126L135 133L120 157L120 150Z" fill="#7c3aed" />

            {/* Mortarboard Hat */}
            <path d="M185 125C185 132 225 137 250 132C275 127 275 118 250 113C225 108 185 118 185 125Z" fill="#312e81" />
            <path d="M185 125V132C185 139 225 144 250 139C275 134 275 125 275 118V125C275 118 275 127 250 132C225 137 185 132 185 125Z" fill="#1e1b4b" />

            <path d="M145 95L245 118L335 90L235 68L145 95Z" fill="#1e1b4b" />
            <path d="M145 95L245 118L240 120L145 97L145 95Z" fill="#312e81" />
            <path d="M245 118L335 90L330 92L240 120L245 118Z" fill="#312e81" />

            {/* Tassel Button */}
            <circle cx="235" cy="90" r="5" fill="#f59e0b" />

            {/* Tassel String */}
            <path d="M235 90C225 93 205 110 205 125" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

            {/* Tassel Fringe */}
            <path d="M201 125C198 128 200 138 205 138C210 138 212 128 209 125H201Z" fill="#f59e0b" />
        </g>

        {/* Soft decorative elements */}
        <g opacity="0.85">
            <path d="M80 80L83 88L91 91L83 94L80 102L77 94L69 91L77 88L80 80Z" fill="#c084fc" />
            <path d="M330 180L332 185L337 187L332 189L330 194L328 189L323 187L328 185L330 180Z" fill="#a78bfa" />
            <path d="M130 50L131 53L134 54L131 55L130 58L129 55L126 54L129 53L130 50Z" fill="#fb7185" />

            <path d="M310 120C320 125 325 135 320 140C315 145 305 140 300 135C295 130 300 115 310 120Z" fill="#c084fc" opacity="0.4" />
            <path d="M90 140C80 145 75 155 80 160C85 165 95 160 100 155C105 150 100 135 90 140Z" fill="#818cf8" opacity="0.3" />
        </g>
    </svg>
);

export default function CourseDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    const load = useCallback(() => {
        coursesAPI.getById(id)
            .then(({ data }) => setData(data))
            .catch(() => toast.error('Cours introuvable'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            await coursesAPI.enroll(id);
            toast.success('Inscription réussie !');
            router.push(`/courses/${id}/learn`);
        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg === 'Déjà inscrit') router.push(`/courses/${id}/learn`);
            else toast.error(msg || 'Erreur inscription');
        } finally { setEnrolling(false); }
    };

    if (loading) return (
        <Sidebar>
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        </Sidebar>
    );

    if (!data) return <Sidebar><p className="text-slate-400 p-8">Cours introuvable</p></Sidebar>;

    const { course, progress, isEnrolled } = data;
    const totalDuration = course.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0;
    const completionPct = progress?.completionPercentage || 0;

    return (
        <Sidebar>
            <div className="max-w-6xl mx-auto px-4 py-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Link href="/courses" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all mb-6">
                    <ArrowLeft className="w-3.5 h-3.5" /> Retour au catalogue
                </Link>

                {/* ── Hero Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-6 shadow-sm relative overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        <div className="md:col-span-7 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-indigo-50 text-[#6366f1] font-bold text-xs px-3 py-1.5 rounded-lg border border-indigo-100/50">
                                    {course.category}
                                </span>
                                <span className="bg-[#ecfdf5] text-[#10b981] font-bold text-xs px-3 py-1.5 rounded-lg border border-emerald-100/50 capitalize">
                                    {course.level}
                                </span>
                                {!course.isPublished && (
                                    <span className="bg-amber-50 text-amber-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-amber-200/50">
                                        Brouillon
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
                                {course.title}
                            </h1>

                            <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                                {course.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-400 font-semibold pt-1">
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-indigo-500" />
                                    {course.enrolledStudents?.length ?? 0} inscrits
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                    {course.lessons?.length ?? 0} leçons
                                </span>
                                {course.instructor && (
                                    <span className="flex items-center gap-1">
                                        Par <strong className="text-slate-700 font-extrabold">{course.instructor.name}</strong>
                                        {course.instructor.speciality && (
                                            <span className="text-slate-400 font-medium"> · {course.instructor.speciality}</span>
                                        )}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3 pt-3">
                                {isEnrolled ? (
                                    <>
                                        <Link href={`/courses/${id}/learn`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-indigo-200 hover:scale-[1.01] active:scale-[0.99]"
                                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                                        >
                                            <Play className="w-3.5 h-3.5 fill-white" /> Continuer le cours
                                        </Link>
                                        {course.instructor && user?.role === 'student' && (
                                            <Link href={`/messages/${course.instructor._id}`}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 transition-all shadow-sm"
                                            >
                                                <Mail className="w-3.5 h-3.5 text-slate-500" /> Contacter l'instructeur
                                            </Link>
                                        )}
                                    </>
                                ) : (
                                    <button onClick={handleEnroll} disabled={enrolling}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-indigo-200 hover:scale-[1.01] active:scale-[0.99]"
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                                    >
                                        {enrolling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        {enrolling ? 'Inscription...' : "S'inscrire gratuitement"}
                                        {!enrolling && <ArrowRight className="w-3.5 h-3.5" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-5 flex items-center justify-center">
                            <GraduationIllustration />
                        </div>
                    </div>
                </div>

                {/* ── Progress Bar ── */}
                {isEnrolled && (
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[280px]">
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                    <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                                    <span>Votre progression</span>
                                </div>
                                <span className="text-[#6366f1] font-extrabold text-2xl">{completionPct}%</span>
                            </div>

                            <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                <div className="h-2 rounded-full transition-all duration-700"
                                    style={{
                                        width: `${completionPct}%`,
                                        background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                                    }}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium">
                                {progress?.completedLessons?.length ?? 0} / {course.lessons?.length ?? 0} leçons complétées
                            </p>
                        </div>

                        <div className="flex items-center flex-shrink-0">
                            <Link href={`/courses/${id}/learn`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#f5f3ff] text-[#6366f1] border border-indigo-100/50 hover:bg-indigo-100/30 transition-all"
                            >
                                <TrendingUp className="w-3.5 h-3.5 text-[#6366f1]" />
                                Voir détails
                            </Link>
                        </div>
                    </div>
                )}

                {/* ── Content Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Programme */}
                    <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-extrabold text-slate-800 mb-5 flex items-center gap-2">
                            <BookOpen className="w-4.5 h-4.5 text-[#6366f1]" />
                            Programme ({course.lessons?.length ?? 0} leçons)
                        </h2>

                        {!course.lessons?.length ? (
                            <p className="text-slate-400 text-xs">Aucune leçon disponible</p>
                        ) : (
                            <div className="space-y-2.5">
                                {course.lessons.map((lesson, i) => {
                                    const done = progress?.completedLessons?.map(String).includes(String(lesson._id));
                                    return (
                                        <div key={lesson._id}
                                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${done
                                                    ? 'bg-[#f5f3ff] border-indigo-100/60'
                                                    : 'bg-white border-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${done
                                                        ? 'bg-[#eeebff] border-indigo-100/50 text-[#6366f1]'
                                                        : 'bg-slate-50 border-slate-100 text-slate-400'
                                                    }`}>
                                                    {done ? <CheckCircle className="w-4 h-4 text-[#6366f1]" /> : i + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-xs font-bold leading-snug truncate ${done ? 'text-slate-800' : 'text-slate-650'
                                                        }`}>
                                                        {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {lesson.duration > 0 && (
                                                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5" /> {lesson.duration} min
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {!isEnrolled ? (
                                                    <span className="bg-slate-50 text-slate-400 border border-slate-100 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                        <Lock className="w-2.5 h-2.5" /> Verrouillée
                                                    </span>
                                                ) : done ? (
                                                    <span className="bg-[#eeebff] text-[#6366f1] px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                                                        Terminée
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-50 text-slate-400 border border-slate-100 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                        Active
                                                    </span>
                                                )}
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Sidebar info */}
                    <div className="space-y-6">
                        {course.instructor && (
                            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" /> Informations sur l'instructeur
                                </h3>

                                <div className="flex items-center gap-3.5 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#6366f1] flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                                        {course.instructor.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 leading-snug">{course.instructor.name}</p>
                                        {course.instructor.speciality && (
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{course.instructor.speciality}</p>
                                        )}
                                    </div>
                                </div>

                                {course.instructor.bio && (
                                    <p className="text-slate-400 text-xs leading-relaxed mb-4 border-t pt-3 border-slate-50">
                                        {course.instructor.bio}
                                    </p>
                                )}

                                {user?.role === 'student' && (
                                    <Link href={`/messages/${course.instructor._id}`}
                                        className="w-full inline-flex items-center gap-1.5 justify-center py-2 text-xs font-bold text-[#6366f1] hover:text-[#4f46e5] border border-dashed border-indigo-200 hover:border-indigo-300 rounded-xl transition-all"
                                    >
                                        <Mail className="w-3.5 h-3.5 text-[#6366f1]" /> Contacter l'instructeur
                                    </Link>
                                )}
                            </div>
                        )}

                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-4">
                                Ce cours inclut
                            </h3>
                            <div className="space-y-3 text-xs text-slate-650 font-medium">
                                <div className="flex items-center gap-2.5">
                                    <BookOpen className="w-4 h-4 text-indigo-500" />
                                    <span>{course.lessons?.length ?? 0} leçons</span>
                                </div>
                                {totalDuration > 0 && (
                                    <div className="flex items-center gap-2.5">
                                        <Clock className="w-4 h-4 text-indigo-500" />
                                        <span>{totalDuration} min de contenu</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2.5">
                                    <Brain className="w-4 h-4 text-indigo-500" />
                                    <span>Quiz adaptatif IA</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                                    <span>Tuteur IA disponible</span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Star className="w-4 h-4 text-indigo-500" />
                                    <span>Accès à vie</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
