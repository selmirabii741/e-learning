'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { coursesAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import {
    Plus, BookOpen, Users, Edit3, Trash2, Search, Eye,
    CheckCircle, FileText, Loader2, Copy, KeyRound,
    ChevronDown, AlertTriangle, Clock, Code, Monitor, Database
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CARD_STYLES = [
    { gradient: 'bg-gradient-to-r from-blue-500 to-cyan-400', icon: Monitor },
    { gradient: 'bg-gradient-to-r from-emerald-500 to-teal-400', icon: Code },
    { gradient: 'bg-gradient-to-r from-indigo-500 to-purple-500', icon: Database },
    { gradient: 'bg-gradient-to-r from-pink-500 to-rose-400', icon: Monitor },
    { gradient: 'bg-gradient-to-r from-orange-500 to-amber-400', icon: Code },
];

const LVL_COLORS = {
    'débutant': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'intermédiaire': 'bg-blue-50 text-blue-600 border-blue-100',
    'avancé': 'bg-rose-50 text-rose-600 border-rose-100',
};

function DeleteModal({ course, onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-200">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-800">Supprimer ce cours ?</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Cette action est irréversible.</p>
                    </div>
                </div>
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl mb-6">
                    <p className="text-sm font-medium text-slate-700">
                        <strong className="font-extrabold">{course?.title}</strong> sera définitivement supprimé, avec toutes ses leçons et la progression des étudiants.
                    </p>
                </div>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        Annuler
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}

function CourseCard({ course, index, onDelete }) {
    const style = CARD_STYLES[index % CARD_STYLES.length];
    const Icon = style.icon;
    const lvlColor = LVL_COLORS[course.level?.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-100';
    const students = course.enrolledStudents?.length ?? 0;
    const lessons = course.lessons?.length ?? 0;
    const date = course.createdAt ? new Date(course.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
            
            {/* Header Gradient Area */}
            <div className={`h-24 ${style.gradient} relative flex items-center justify-center`}>
                <Icon className="w-12 h-12 text-white/30" />
                
                {/* Published Badge */}
                <div className="absolute top-3 right-3">
                    {course.isPublished ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] font-extrabold text-emerald-600 tracking-wide uppercase">Publié</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur rounded-full shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            <span className="text-[10px] font-extrabold text-orange-600 tracking-wide uppercase">Brouillon</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 pt-0 flex flex-col relative bg-white">
                
                {/* Overlapping Badges */}
                <div className="flex items-center gap-2 -mt-3.5 mb-4 relative z-10">
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                        {course.category || 'Programmation'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${lvlColor}`}>
                        {course.level || 'Débutant'}
                    </span>
                </div>

                <Link href={`/instructor/courses/${course._id}/edit`} className="flex-1 block">
                    <h3 className="text-[17px] font-extrabold text-slate-800 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {course.title}
                    </h3>
                    <p className="text-[13px] font-medium text-slate-500 line-clamp-2 mb-5">
                        {course.description || "Aucune description fournie pour ce cours."}
                    </p>
                </Link>

                <div className="flex items-center gap-4 text-slate-400 mb-4">
                    <div className="flex items-center gap-1.5 text-[12px] font-bold">
                        <Users className="w-4 h-4" /> {students} étudiant{students !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] font-bold">
                        <FileText className="w-4 h-4" /> {lessons} leçon{lessons !== 1 ? 's' : ''}
                    </div>
                    {date && (
                        <div className="flex items-center gap-1.5 text-[12px] font-bold ml-auto">
                            <Clock className="w-3.5 h-3.5" /> {date}
                        </div>
                    )}
                </div>

                {course.enrollmentCode && (
                    <button 
                        onClick={() => { navigator.clipboard.writeText(course.enrollmentCode); toast.success('Code copié !'); }}
                        className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-lg bg-indigo-50/50 text-indigo-600 hover:bg-indigo-50 transition-colors border border-indigo-100 border-dashed"
                    >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span className="text-[12px] font-bold tracking-wider font-mono">{course.enrollmentCode}</span>
                        <Copy className="w-3 h-3 opacity-50 ml-1" />
                    </button>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                <Link 
                    href={`/instructor/courses/${course._id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm transition-all"
                >
                    <Edit3 className="w-4 h-4" /> Modifier
                </Link>
                <Link 
                    href={`/instructor/courses/${course._id}/students`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-sm transition-all"
                >
                    <Users className="w-4 h-4" /> Étudiants
                </Link>
                <button 
                    onClick={() => onDelete(course)}
                    className="w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 hover:shadow-sm transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, colorClass, chartColor }) {
    return (
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <span className="text-3xl font-extrabold text-slate-800 leading-none block mb-1">{value ?? '—'}</span>
                    <h3 className="text-[13px] font-bold text-slate-500">{label}</h3>
                </div>
            </div>
            <div className="flex justify-end mt-2">
                <svg width="60" height="20" viewBox="0 0 60 20" fill="none" className="opacity-80">
                    <path d="M0 15C10 15 15 5 25 10C35 15 45 5 60 2" stroke={chartColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
        </div>
    );
}

export default function InstructorDashboard() {
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const { user } = useAuthStore();

    // Redirect pending/rejected instructors to the approval page
    const isPendingInstructor = user?.role === 'instructor' && user?.status && user.status !== 'approved';

    const load = useCallback(() => {
        if (!user || isPendingInstructor) return;
        setLoading(true);
        coursesAPI.getMyCourses()
            .then(({ data }) => { setCourses(data.courses || []); setStats(data.stats); })
            .catch(() => toast.error('Erreur chargement'))
            .finally(() => setLoading(false));
    }, [user, isPendingInstructor]);

    useEffect(() => { load(); }, [load]);

    const categories = useMemo(() => [...new Set(courses.map(c => c.category).filter(Boolean))], [courses]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return courses.filter(c => {
            if (q && !c.title?.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q)) return false;
            if (filterCat && c.category !== filterCat) return false;
            if (filterStatus === 'published' && !c.isPublished) return false;
            if (filterStatus === 'draft' && c.isPublished) return false;
            return true;
        });
    }, [courses, search, filterCat, filterStatus]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget._id);
        try {
            await coursesAPI.delete(deleteTarget._id);
            setCourses(prev => prev.filter(c => c._id !== deleteTarget._id));
            toast.success('Cours supprimé');
            setDeleteTarget(null);
        } catch { toast.error('Erreur suppression'); }
        finally { setDeletingId(null); }
    };

    return (
        <Sidebar>
            <div className="bg-[#F8FAFC] min-h-[calc(100vh-80px)]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="max-w-[1400px] mx-auto p-6 md:p-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Mes cours</h1>
                            <p className="text-[15px] font-medium text-slate-500">
                                Gérez et suivez tous vos cours en un seul endroit
                            </p>
                        </div>
                        <Link 
                            href="/instructor/courses/new" 
                            className="flex items-center gap-2 px-6 py-3.5 rounded-[16px] text-[15px] font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                        >
                            <Plus className="w-5 h-5" /> Nouveau cours
                        </Link>
                    </div>

                    {/* Stats */}
                    {!loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <StatCard icon={BookOpen} label="Total cours" value={stats?.totalCourses} colorClass="bg-indigo-50 text-indigo-500" chartColor="#6366f1" />
                            <StatCard icon={CheckCircle} label="Publiés" value={stats?.publishedCourses} colorClass="bg-emerald-50 text-emerald-500" chartColor="#10b981" />
                            <StatCard icon={Users} label="Étudiants" value={stats?.totalStudents} colorClass="bg-purple-50 text-purple-500" chartColor="#a855f7" />
                            <StatCard icon={FileText} label="Leçons" value={stats?.totalLessons} colorClass="bg-orange-50 text-orange-500" chartColor="#f97316" />
                        </div>
                    )}

                    {/* Filters Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            <input 
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                                placeholder="Rechercher un cours..." 
                                value={search} 
                                onChange={e => setSearch(e.target.value)} 
                            />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="relative">
                                <select 
                                    value={filterCat} 
                                    onChange={e => setFilterCat(e.target.value)} 
                                    className="appearance-none pl-5 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm cursor-pointer min-w-[180px]"
                                >
                                    <option value="">Toutes catégories</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select 
                                    value={filterStatus} 
                                    onChange={e => setFilterStatus(e.target.value)} 
                                    className="appearance-none pl-5 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm cursor-pointer min-w-[160px]"
                                >
                                    <option value="">Tous statuts</option>
                                    <option value="published">Publié</option>
                                    <option value="draft">Brouillon</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            {(search || filterCat || filterStatus) && (
                                <button 
                                    onClick={() => { setSearch(''); setFilterCat(''); setFilterStatus(''); }}
                                    className="px-4 py-3 rounded-2xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors text-[14px]"
                                >
                                    Réinitialiser
                                </button>
                            )}
                            {!loading && <span className="text-[14px] font-bold text-slate-400 ml-2">{filtered.length} cours</span>}
                        </div>
                    </div>

                    {/* Course Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-[360px] rounded-3xl bg-white border border-slate-100 shadow-sm animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm mt-8">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-50 flex items-center justify-center">
                                <BookOpen className="w-10 h-10 text-indigo-300" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">
                                {courses.length === 0 ? 'Créez votre premier cours' : 'Aucun cours trouvé'}
                            </h3>
                            <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                                {courses.length === 0 ? 'Commencez à partager vos connaissances en créant un cours incroyable.' : 'Aucun cours ne correspond à vos filtres actuels.'}
                            </p>
                            {courses.length === 0 && (
                                <Link 
                                    href="/instructor/courses/new" 
                                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                                >
                                    <Plus className="w-5 h-5" /> Créer un cours
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filtered.map((course, i) => (
                                <CourseCard key={course._id} course={course} index={i} onDelete={setDeleteTarget} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {deleteTarget && (
                <DeleteModal course={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deletingId === deleteTarget._id} />
            )}
        </Sidebar>
    );
}
