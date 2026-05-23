'use client';
import { useEffect, useState, useMemo } from 'react';
import { coursesAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { 
    BarChart2, Users, CheckCircle, TrendingUp, BookOpen, 
    Loader2, ArrowLeft, Activity, ChevronDown, Trophy, 
    PieChart, Star, Download, Edit3 
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

/* ─── Stat Card ──────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, colorClass, chartColor }) {
    return (
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between group">
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass} transition-transform group-hover:scale-110`}>
                    <Icon className="w-7 h-7" />
                </div>
                <div>
                    <span className="text-3xl font-extrabold text-slate-800 leading-none block mb-1">{value ?? '—'}</span>
                    <h3 className="text-sm font-bold text-slate-500">{label}</h3>
                </div>
            </div>
            <div className="flex items-center justify-between mt-2">
                {sub ? (
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {sub}
                    </span>
                ) : (
                    <span className="text-xs font-bold text-slate-400">Stable</span>
                )}
                <div className="flex justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                    <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
                        <path d="M0 15C10 15 15 5 25 10C35 15 45 5 60 2" stroke={chartColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>
        </div>
    );
}

/* ─── Premium SVG Line Chart ────────────────────────────────────────────────── */
function AreaChart({ data }) {
    const max = Math.max(...data, 1);
    const w = 800, h = 280, padL = 40, padR = 20, padT = 20, padB = 30;
    const chartW = w - padL - padR, chartH = h - padT - padB;

    const pts = data.map((v, i) => ({
        x: padL + (i / (data.length - 1)) * chartW,
        y: padT + chartH - (v / max) * chartH
    }));

    function smooth(points) {
        if (points.length < 2) return '';
        const t = 0.3;
        let d = `M${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)], p1 = points[i];
            const p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
            d += ` C${p1.x + (p2.x - p0.x) * t},${p1.y + (p2.y - p0.y) * t} ${p2.x - (p3.x - p1.x) * t},${p2.y - (p3.y - p1.y) * t} ${p2.x},${p2.y}`;
        }
        return d;
    }

    const line = smooth(pts);
    const area = line + ` L${pts[pts.length - 1].x},${padT + chartH} L${pts[0].x},${padT + chartH} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full drop-shadow-sm" preserveAspectRatio="none">
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => {
                const y = padT + chartH - (v) * chartH;
                const val = Math.round(v * max);
                return (
                    <g key={i}>
                        <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
                        <text x={padL - 10} y={y + 4} textAnchor="end" className="text-[11px] fill-slate-400 font-medium">{val}h</text>
                    </g>
                );
            })}
            {/* X Axis labels */}
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((l, i) => (
                <text key={i} x={padL + (i / 6) * chartW} y={h - 5} textAnchor="middle" className="text-[12px] fill-slate-400 font-semibold">{l}</text>
            ))}
            {/* Area and Line */}
            <path d={area} fill="url(#chartGradient)" />
            <path d={line} fill="none" stroke="url(#chartGradient)" className="stroke-indigo-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Data Points */}
            {pts.map((p, i) => (
                <g key={i} className="group cursor-pointer">
                    <circle cx={p.x} cy={p.y} r="6" className="fill-white stroke-indigo-500 transition-all duration-300 group-hover:r-8 group-hover:stroke-[4px]" strokeWidth="3" />
                    <text x={p.x} y={p.y - 15} textAnchor="middle" className="text-[12px] fill-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
                        {data[i]}h
                    </text>
                </g>
            ))}
        </svg>
    );
}

export default function InstructorAnalyticsPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('7jours');

    useEffect(() => {
        coursesAPI.getMyCourses()
            .then(({ data }) => setCourses(data.courses || []))
            .catch(() => toast.error('Erreur chargement'))
            .finally(() => setLoading(false));
    }, []);

    // Derived Stats
    const totalStudents = courses.reduce((a, c) => a + (c.enrolledStudents?.length || 0), 0);
    const totalPublished = courses.filter((c) => c.isPublished).length;
    const avgStudents = courses.length ? Math.round(totalStudents / courses.length) : 0;
    const topCourse = courses.length > 0 ? [...courses].sort((a, b) => (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0))[0] : null;

    const categories = useMemo(() => {
        const counts = courses.reduce((acc, c) => {
            const cat = c.category || 'Général';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    }, [courses]);

    // Mock weekly engagement data
    const engagementData = [12.5, 15.2, 18.8, 14.2, 22.5, 20.0, 25.2]; 

    return (
        <Sidebar>
            <div className="bg-[#F8FAFC] min-h-[calc(100vh-80px)]" style={{ fontFamily: 'Inter, sans-serif' }}>
                <div className="max-w-[1400px] mx-auto p-6 md:p-8">

                    {/* ── Header ── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-200/60">
                        <div className="flex items-center gap-5">
                            <Link href="/instructor" className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:shadow-md transition-all text-slate-600">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                                        <BarChart2 className="w-6 h-6" />
                                    </div>
                                    Analytics
                                </h1>
                                <p className="text-[15px] font-medium text-slate-500 mt-1">
                                    Suivez les performances de vos cours et l'engagement des étudiants.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <select 
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="appearance-none pl-5 pr-12 py-3 bg-white border border-slate-200 rounded-[14px] text-[14px] font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer transition-all"
                                >
                                    <option value="7jours">7 derniers jours</option>
                                    <option value="30jours">30 derniers jours</option>
                                    <option value="3mois">3 derniers mois</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-[14px] text-[14px] font-bold shadow-md hover:shadow-lg transition-all">
                                <Download className="w-4 h-4" /> Exporter
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* ── Stats Section ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                                <StatCard icon={BookOpen} label="Total cours" value={courses.length} colorClass="bg-indigo-50 text-indigo-600" chartColor="#6366f1" />
                                <StatCard icon={CheckCircle} label="Cours publiés" value={totalPublished} colorClass="bg-emerald-50 text-emerald-600" chartColor="#10b981" />
                                <StatCard icon={Users} label="Étudiants (Total)" value={totalStudents} colorClass="bg-purple-50 text-purple-600" sub="+12%" chartColor="#a855f7" />
                                <StatCard icon={TrendingUp} label="Moy. étudiants/cours" value={avgStudents} colorClass="bg-orange-50 text-orange-600" chartColor="#f97316" />
                            </div>

                            {/* ── Main Analytics Grid ── */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
                                
                                {/* Engagement Chart */}
                                <div className="xl:col-span-2 bg-white rounded-[24px] border border-slate-100 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none"></div>
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div>
                                            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                                                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"><Activity className="w-5 h-5" /></div>
                                                Heures d'apprentissage
                                            </h3>
                                            <p className="text-sm font-medium text-slate-500 mt-2">Volume d'activité cumulé sur vos cours cette semaine.</p>
                                        </div>
                                        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-extrabold rounded-full border border-indigo-100 uppercase tracking-wider">
                                            +24% vs semaine prop.
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full relative z-10" style={{ minHeight: '280px' }}>
                                        <AreaChart data={engagementData} />
                                    </div>
                                </div>

                                {/* Side Panel: Top Course & Categories */}
                                <div className="flex flex-col gap-8">
                                    
                                    {/* Top Course */}
                                    <div className="bg-white rounded-[24px] border border-slate-100 p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex-1 flex flex-col group hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
                                        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                                            <Trophy className="w-4 h-4 text-amber-500" /> Top Performance
                                        </h3>
                                        {topCourse ? (
                                            <div className="flex flex-col flex-1 justify-center items-center text-center">
                                                <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-400 rounded-[20px] p-0.5 shadow-lg shadow-amber-500/20 mb-5 group-hover:scale-105 transition-transform">
                                                    <div className="w-full h-full bg-white rounded-[18px] flex items-center justify-center">
                                                        <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                                                    </div>
                                                </div>
                                                <h4 className="text-lg font-extrabold text-slate-800 line-clamp-2 leading-tight mb-2">
                                                    {topCourse.title}
                                                </h4>
                                                <p className="text-sm font-bold text-slate-500 mb-6 bg-slate-50 px-4 py-2 rounded-xl">
                                                    <span className="text-amber-500 font-extrabold">{topCourse.enrolledStudents?.length || 0}</span> étudiants actifs
                                                </p>
                                                <Link href={`/instructor/courses/${topCourse._id}/students`} className="w-full py-3 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors">
                                                    Gérer les étudiants
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-sm font-medium text-slate-400">Pas de données</div>
                                        )}
                                    </div>

                                    {/* Categories */}
                                    <div className="bg-white rounded-[24px] border border-slate-100 p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                                        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
                                            <PieChart className="w-4 h-4 text-emerald-500" /> Répartition
                                        </h3>
                                        {categories.length > 0 ? (
                                            <div className="flex flex-col gap-5">
                                                {categories.slice(0, 4).map((cat, i) => {
                                                    const pct = Math.round((cat.count / courses.length) * 100);
                                                    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-orange-500'];
                                                    const color = colors[i % colors.length];
                                                    return (
                                                        <div key={i}>
                                                            <div className="flex justify-between text-sm font-bold mb-2">
                                                                <span className="text-slate-600">{cat.name}</span>
                                                                <span className="text-slate-800">{pct}%</span>
                                                            </div>
                                                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-sm font-medium text-slate-400 text-center py-4">Aucune catégorie</div>
                                        )}
                                    </div>

                                </div>
                            </div>

                            {/* ── Courses Detail Grid ── */}
                            <div className="mb-8">
                                <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-3">
                                    <BookOpen className="w-6 h-6 text-indigo-500" /> Détails par cours
                                </h2>

                                {courses.length === 0 ? (
                                    <div className="bg-white rounded-[32px] border border-slate-100 p-16 text-center shadow-sm">
                                        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-indigo-50 flex items-center justify-center">
                                            <BookOpen className="w-10 h-10 text-indigo-300" />
                                        </div>
                                        <h3 className="text-2xl font-extrabold text-slate-800 mb-3">Aucun cours créé</h3>
                                        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">Lancez votre premier cours pour voir vos statistiques s'afficher ici.</p>
                                        <Link href="/instructor/courses/new" className="inline-flex items-center gap-2 px-8 py-4 rounded-[16px] text-[15px] font-bold text-white shadow-lg shadow-indigo-500/30 hover:-translate-y-1 transition-all bg-gradient-to-r from-indigo-500 to-purple-500">
                                            Créer mon premier cours
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {courses.map((course) => {
                                            const enrolled = course.enrolledStudents?.length || 0;
                                            const maxStudents = Math.max(...courses.map((c) => c.enrolledStudents?.length || 0), 1);
                                            const pct = Math.round((enrolled / maxStudents) * 100);

                                            return (
                                                <div key={course._id} className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all flex flex-col">
                                                    <div className="flex justify-between items-start mb-4 gap-4">
                                                        <h3 className="text-lg font-extrabold text-slate-800 leading-tight line-clamp-2">{course.title}</h3>
                                                        {course.isPublished ? (
                                                            <span className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Publié
                                                            </span>
                                                        ) : (
                                                            <span className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Brouillon
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                                        {course.category || 'Général'}
                                                    </div>

                                                    <div className="mb-6 flex-1">
                                                        <div className="flex items-end justify-between mb-2">
                                                            <span className="text-sm font-bold text-slate-500">Inscriptions</span>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-extrabold text-slate-800 leading-none">{enrolled}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 pt-6 border-t border-slate-100">
                                                        <Link href={`/instructor/courses/${course._id}/edit`} className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                                                            <Edit3 className="w-4 h-4" /> Éditer
                                                        </Link>
                                                        <Link href={`/instructor/courses/${course._id}/students`} className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-indigo-50 text-indigo-600 border border-transparent rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                                                            <Users className="w-4 h-4" /> Étudiants
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Sidebar>
    );
}
