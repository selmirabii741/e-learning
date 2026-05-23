'use client';
import { useEffect, useState, useMemo } from 'react';
import { coursesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import { Search, BookOpen, Users, ChevronDown, Loader2, Play, KeyRound, X, ShieldCheck, SendHorizonal, Clock, Code, Database, Rocket, Briefcase, Palette, Laptop, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/* ── Badge Component ── */
const badgeStyles = {
    category: { bg: 'bg-[#EEF2FF]', text: 'text-[#4F46E5]', border: 'border-[#C7D2FE]' },
    level: {
        'débutant': { bg: 'bg-[#FFF7ED]', text: 'text-[#F97316]', border: 'border-[#FDBA74]' },
        'intermédiaire': { bg: 'bg-[#FAF5FF]', text: 'text-[#8B5CF6]', border: 'border-[#DDD6FE]' },
        'avancé': { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', border: 'border-[#FECACA]' },
        default: { bg: 'bg-[#F8FAFC]', text: 'text-[#64748B]', border: 'border-[#CBD5E1]' }
    },
    students: { bg: 'bg-[#F0FDF4]', text: 'text-[#10B981]', border: 'border-[#BBF7D0]' },
    published: { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', border: 'border-[#A7F3D0]' },
    draft: { bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]', border: 'border-[#FDE68A]' },
};

function Bdg({ label, type = 'default', subType = '' }) {
    let s = badgeStyles[type] || badgeStyles.default;
    if (type === 'level') {
        s = badgeStyles.level[subType?.toLowerCase()] || badgeStyles.level.default;
    }
    return (
        <span className={`inline-flex items-center h-7 px-3 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap border ${s.bg} ${s.text} ${s.border} capitalize`}>
            {label}
        </span>
    );
}

/* ── Helper to get course icon based on category ── */
function getCourseIcon(category) {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('dev') || cat.includes('prog')) return <Code className="w-8 h-8 text-white" />;
    if (cat.includes('data')) return <Database className="w-8 h-8 text-white" />;
    if (cat.includes('design')) return <Palette className="w-8 h-8 text-white" />;
    if (cat.includes('business') || cat.includes('marketing')) return <Briefcase className="w-8 h-8 text-white" />;
    if (cat.includes('it') || cat.includes('system')) return <Laptop className="w-8 h-8 text-white" />;
    return <Rocket className="w-8 h-8 text-white" />;
}

/* ── Helper to get gradient based on index ── */
const gradients = [
    'from-[#6D5DFC] to-[#8B5CF6]',
    'from-[#3B82F6] to-[#60A5FA]',
    'from-[#10B981] to-[#34D399]',
    'from-[#F59E0B] to-[#FBBF24]',
    'from-[#EC4899] to-[#F472B6]',
];
function getGradient(index) {
    return gradients[index % gradients.length];
}

/* ── Course Card ── */
function CourseCard({ course, index, enrolledIds, onEnroll, enrollingId, requestedIds, onRequest, requestingId, router }) {
    const isEnrolled = enrolledIds.has(course._id);
    const isEnrolling = enrollingId === course._id;
    const isRequested = requestedIds?.has(course._id);
    const isRequesting = requestingId === course._id;
    const cat = course.category || 'Général';
    const lvl = course.level || 'Tous niveaux';
    const students = course.enrolledStudents?.length ?? 0;
    const date = course.createdAt
        ? new Date(course.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] hover:border-[#8B5CF6] hover:shadow-md transition-all duration-300 p-5 flex flex-col md:flex-row gap-6 md:items-center">
            {/* LEFT: Thumbnail */}
            <div className={`w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-[18px] bg-gradient-to-br ${getGradient(index)} flex items-center justify-center shadow-inner`}>
                {getCourseIcon(cat)}
            </div>

            {/* CENTER: Info */}
            <div className="flex-1 flex flex-col items-start min-w-0">
                <h3 className="text-[17px] font-bold text-[#0F172A] mb-2.5 truncate w-full leading-snug">
                    {course.title}
                </h3>
                <div className="flex flex-wrap items-center text-[13px] text-[#64748B] font-medium gap-3">
                    <div className="flex items-center gap-2 bg-[#F8FAFC] pr-3 rounded-full border border-[#E5E7EB]">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6D5DFC] to-[#8B5CF6] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            {course.instructor?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-[#0F172A] font-semibold">{course.instructor?.name || 'Instructeur inconnu'}</span>
                    </div>
                    <span className="text-[#CBD5E1]">•</span>
                    <span suppressHydrationWarning>{date}</span>
                </div>
            </div>

            {/* RIGHT: Badges & Actions */}
            <div className="flex flex-col md:items-end justify-between gap-4 flex-shrink-0 md:w-[280px]">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 md:justify-end">
                    <Bdg label={cat} type="category" />
                    <Bdg label={lvl} type="level" subType={lvl} />
                    <Bdg label={`${students} étud.`} type="students" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    {isEnrolled ? (
                        <button onClick={() => router.push(`/courses/${course._id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-[#6D5DFC] to-[#4F46E5] shadow-[0_4px_12px_rgba(109,93,252,0.25)] hover:scale-[1.02] transition-transform">
                            <Play size={14} fill="currentColor" /> Continuer
                        </button>
                    ) : isRequested ? (
                        <span className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-[#64748B] bg-[#F8FAFC] border border-[#CBD5E1] cursor-not-allowed">
                            <Clock size={14} /> En attente
                        </span>
                    ) : (
                        <>
                            <button onClick={() => onRequest(course._id)} disabled={isRequesting} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#475569] bg-white border border-[#E5E7EB] hover:border-[#C7D2FE] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isRequesting ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
                                <span className="hidden sm:inline">Demander</span>
                            </button>
                            <button onClick={() => onEnroll(course._id)} disabled={isEnrolling} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-[#6D5DFC] to-[#4F46E5] shadow-[0_4px_12px_rgba(109,93,252,0.25)] hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:cursor-not-allowed">
                                {isEnrolling ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                {isEnrolling ? '...' : "S'inscrire"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Join-by-code Modal ── */
function JoinByCodeModal({ open, onClose, onSuccess }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await coursesAPI.joinByCode(code.trim());
            toast.success(`${data.message} — ${data.courseTitle}`);
            onSuccess(data.courseId);
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || 'Erreur';
            const instructor = err.response?.data?.instructorName;
            setError(instructor ? `${msg}` : msg);
            if (err.response?.data?.courseId) {
                onSuccess(err.response.data.courseId);
                onClose();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-[420px] max-w-[90vw] bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.2)] p-7">
                <button onClick={onClose} className="absolute top-4 right-4 text-[#64748B] hover:text-[#0F172A] transition-colors">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6D5DFC] to-[#8B5CF6] flex items-center justify-center shadow-md">
                        <KeyRound size={22} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-[18px] font-bold text-[#0F172A]">Rejoindre un cours</h2>
                        <p className="text-[13px] text-[#64748B] mt-0.5">Saisissez le code d'accès privé</p>
                    </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 bg-[#EEF2FF] border border-[#C7D2FE]">
                    <ShieldCheck size={16} className="text-[#6D5DFC] flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#4F46E5] leading-relaxed">
                        Pour des raisons de sécurité, vous devez être affilié à l'instructeur avant de pouvoir utiliser son code d'accès.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        placeholder="EX: A3F2B1C9"
                        maxLength={8}
                        className={`w-full p-3.5 text-center text-lg font-bold tracking-widest uppercase bg-[#F8FAFC] rounded-xl outline-none transition-colors font-mono border-2 ${error ? 'border-[#EF4444] text-[#EF4444]' : 'border-[#E5E7EB] text-[#0F172A] focus:border-[#6D5DFC]'}`}
                        autoFocus
                    />

                    {error && (
                        <p className="text-[13px] text-[#EF4444] mt-2.5 font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.trim().length < 4}
                        className="w-full mt-5 py-3 rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#6D5DFC] to-[#8B5CF6] shadow-[0_4px_12px_rgba(109,93,252,0.25)] hover:scale-[1.02]"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                        {loading ? 'Validation en cours...' : 'Accéder au cours'}
                    </button>
                </form>
            </div>
        </div>
    );
}

/* ── Page ── */
export default function CoursesListPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterLvl, setFilterLvl] = useState('');
    const [enrolledIds, setEnrolledIds] = useState(new Set());
    const [enrollingId, setEnrollingId] = useState(null);
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [requestedIds, setRequestedIds] = useState(new Set());
    const [requestingId, setRequestingId] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        if (user?.role === 'admin') router.replace('/admin');
        if (user?.role === 'instructor') router.replace('/instructor');
    }, [user, router]);

    useEffect(() => {
        coursesAPI.getAll({ published: true })
            .then(({ data }) => {
                const list = Array.isArray(data) ? data : (data.courses || []);
                setCourses(list.filter(c => c.isPublished));
            })
            .catch(() => toast.error('Erreur chargement des cours'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!user || !courses.length) return;
        const uid = user.id || user._id;
        setEnrolledIds(new Set(
            courses.filter(c => c.enrolledStudents?.some(s => (s._id || s) === uid)).map(c => c._id)
        ));
    }, [courses, user]);

    useEffect(() => {
        if (!user) return;
        coursesAPI.getMyRequests()
            .then(({ data }) => {
                const pending = (data.requests || [])
                    .filter(r => r.status === 'pending')
                    .map(r => r.course?._id)
                    .filter(Boolean);
                setRequestedIds(new Set(pending));
            })
            .catch(() => { });
    }, [user]);

    const categories = useMemo(() => [...new Set(courses.map(c => c.category).filter(Boolean))], [courses]);
    const levels = useMemo(() => [...new Set(courses.map(c => c.level).filter(Boolean))], [courses]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        let res = courses.filter(c => {
            if (q && !c.title?.toLowerCase().includes(q) && !c.instructor?.name?.toLowerCase().includes(q)) return false;
            if (filterCat && c.category !== filterCat) return false;
            if (filterLvl && c.level !== filterLvl) return false;
            return true;
        });
        return res;
    }, [courses, search, filterCat, filterLvl]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterCat, filterLvl]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedCourses = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleEnroll = async (courseId) => {
        if (!user) { toast.error('Connectez-vous pour vous inscrire'); return; }
        setEnrollingId(courseId);
        try {
            await coursesAPI.enroll(courseId);
            toast.success('Inscription réussie ! 🎉');
            setEnrolledIds(prev => new Set([...prev, courseId]));
            router.push(`/courses/${courseId}`);
        } catch (err) {
            const msg = err.response?.data?.message;
            if (msg === 'Déjà inscrit') { setEnrolledIds(prev => new Set([...prev, courseId])); router.push(`/courses/${courseId}`); }
            else if (err.response?.data?.requireCode) {
                toast('Ce cours nécessite un code d\'inscription', { icon: '🔑' });
                setJoinModalOpen(true);
            }
            else toast.error(msg || "Erreur lors de l'inscription");
        } finally { setEnrollingId(null); }
    };

    const handleRequest = async (courseId) => {
        if (!user) { toast.error('Connectez-vous d\'abord'); return; }
        setRequestingId(courseId);
        try {
            await coursesAPI.requestAccess(courseId, '');
            toast.success('Demande envoyée ! L\'instructeur sera notifié.', { icon: '📩' });
            setRequestedIds(prev => new Set([...prev, courseId]));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur');
        } finally { setRequestingId(null); }
    };

    return (
        <Sidebar>
            <div className="max-w-[1200px] mx-auto pb-12 font-sans bg-[#F8FAFC] min-h-screen">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[16px] bg-[#EEF2FF] flex items-center justify-center text-[#6D5DFC] shadow-sm">
                            <BookOpen size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-[28px] font-extrabold text-[#0F172A] leading-tight tracking-tight">Liste de cours</h1>
                            <p className="text-[15px] text-[#64748B] font-medium mt-0.5">
                                {loading ? 'Chargement...' : `${filtered.length} cours disponibles`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setJoinModalOpen(true)}
                        className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-[14px] font-bold text-white bg-gradient-to-r from-[#6D5DFC] to-[#8B5CF6] shadow-[0_6px_16px_rgba(109,93,252,0.25)] hover:scale-[1.02] transition-all"
                    >
                        <KeyRound size={18} /> Rejoindre avec un code
                    </button>
                </div>

                {/* BARRE FILTRES */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Rechercher un cours, instructeur..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[#F8FAFC] border border-[#E5E7EB] text-[#0F172A] placeholder-[#94A3B8] text-[14px] font-medium rounded-xl py-3 pl-12 pr-4 outline-none focus:border-[#6D5DFC] focus:ring-4 focus:ring-[#EEF2FF] transition-all"
                        />
                    </div>
                    <div className="flex w-full md:w-auto gap-4">
                        <div className="relative flex-1 md:w-[200px]">
                            <select
                                value={filterCat}
                                onChange={(e) => setFilterCat(e.target.value)}
                                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] text-[#475569] text-[14px] font-medium rounded-xl py-3 pl-4 pr-10 appearance-none outline-none focus:border-[#6D5DFC] focus:ring-4 focus:ring-[#EEF2FF] transition-all cursor-pointer"
                            >
                                <option value="">Toutes catégories</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] w-4 h-4 pointer-events-none" />
                        </div>
                        <div className="relative flex-1 md:w-[180px]">
                            <select
                                value={filterLvl}
                                onChange={(e) => setFilterLvl(e.target.value)}
                                className="w-full bg-[#F8FAFC] border border-[#E5E7EB] text-[#475569] text-[14px] font-medium rounded-xl py-3 pl-4 pr-10 appearance-none outline-none focus:border-[#6D5DFC] focus:ring-4 focus:ring-[#EEF2FF] transition-all cursor-pointer"
                            >
                                <option value="">Tous niveaux</option>
                                {levels.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] w-4 h-4 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* COURSE LIST */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-[#6D5DFC] animate-spin mb-4" />
                        <p className="text-[#64748B] font-medium">Chargement des cours...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] border-dashed p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mb-5">
                            <Search className="w-8 h-8 text-[#94A3B8]" />
                        </div>
                        <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">Aucun cours trouvé</h3>
                        <p className="text-[#64748B]">Essayez de modifier vos critères de recherche ou de retirer certains filtres.</p>
                        {(search || filterCat || filterLvl) && (
                            <button onClick={() => { setSearch(''); setFilterCat(''); setFilterLvl(''); }} className="mt-6 px-5 py-2.5 bg-[#EEF2FF] text-[#6D5DFC] font-semibold rounded-xl hover:bg-[#E0E7FF] transition-colors">
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {paginatedCourses.map((course, i) => (
                                <CourseCard
                                    key={course._id}
                                    index={(currentPage - 1) * itemsPerPage + i}
                                    course={course}
                                    enrolledIds={enrolledIds}
                                    onEnroll={handleEnroll}
                                    enrollingId={enrollingId}
                                    requestedIds={requestedIds}
                                    onRequest={handleRequest}
                                    requestingId={requestingId}
                                    router={router}
                                />
                            ))}
                        </div>

                        {/* PAGINATION */}
                        {totalPages > 0 && (
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className="text-[13px] text-[#64748B] font-medium">Afficher</span>
                                    <div className="relative">
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                            className="appearance-none bg-[#F8FAFC] border border-[#E5E7EB] text-[#0F172A] text-[13px] font-semibold rounded-lg py-2 pl-3 pr-8 outline-none focus:border-[#6D5DFC] cursor-pointer"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] w-3.5 h-3.5 pointer-events-none" />
                                    </div>
                                    <span className="text-[13px] text-[#64748B] font-medium">par page</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    
                                    <div className="flex items-center gap-1.5 mx-2">
                                        {[...Array(totalPages)].map((_, idx) => {
                                            const page = idx + 1;
                                            // Simple pagination logic (show 5 max)
                                            if (totalPages > 5 && (page < currentPage - 1 || page > currentPage + 1) && page !== 1 && page !== totalPages) {
                                                if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="text-[#94A3B8]">...</span>;
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${currentPage === page ? 'bg-[#6D5DFC] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
                                                >
                                                    {page}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E5E7EB] text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Join Modal */}
            <JoinByCodeModal
                open={joinModalOpen}
                onClose={() => setJoinModalOpen(false)}
                onSuccess={(courseId) => router.push(`/courses/${courseId}`)}
            />
        </Sidebar>
    );
}
