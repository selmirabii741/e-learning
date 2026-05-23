'use client';
import { useAuthStore } from '@/lib/authStore';
import Sidebar from '@/components/layout/Sidebar';
import {
    BookOpen, Users, TrendingUp, ClipboardList,
    MoreVertical, ArrowRight, ChevronLeft, ChevronRight,
    CheckCircle2, Circle, UserPlus, FileText, CheckSquare, Mail, Plus
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { coursesAPI } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InstructorHome() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [recentCourses, setRecentCourses] = useState([]);

    useEffect(() => {
        if (!user) return;
        // Fetch some real stats from the existing API
        coursesAPI.getMyCourses().then(({ data }) => {
            setStats(data.stats);
            setRecentCourses(data.courses?.slice(0, 3) || []);
        }).catch(() => {});
    }, [user]);

    const chartData = [
        { name: '12 mai', inscriptions: 40, vues: 24 },
        { name: '13 mai', inscriptions: 60, vues: 38 },
        { name: '14 mai', inscriptions: 55, vues: 45 },
        { name: '15 mai', inscriptions: 75, vues: 50 },
        { name: '16 mai', inscriptions: 50, vues: 65 },
        { name: '17 mai', inscriptions: 60, vues: 45 },
        { name: '18 mai', inscriptions: 85, vues: 70 },
    ];

    const OverviewChart = () => (
        <div className="w-full h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorVues" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                        labelStyle={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}
                    />
                    <Area type="monotone" dataKey="inscriptions" name="Inscriptions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorInscriptions)" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                    <Area type="monotone" dataKey="vues" name="Vues" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVues)" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <Sidebar>
            <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 animate-fade-in" style={{ fontFamily: 'Inter, sans-serif' }}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                            Bonjour, {user?.name?.split(' ')[0] || 'Instructeur'} <span className="text-2xl animate-wave origin-bottom-right">👋</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            Voici un aperçu de votre activité aujourd'hui.
                        </p>
                    </div>
                    <Link href="/instructor/courses/new"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                    >
                        <Plus className="w-5 h-5" />
                        Nouveau cours
                    </Link>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    
                    {/* Cours publiés */}
                    <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between h-[130px]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 mb-0.5">Cours publiés</h3>
                                <span className="text-3xl font-extrabold text-slate-800 leading-none block">{stats?.publishedCourses ?? 12}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pl-1">
                            <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                                +2 ce mois <TrendingUp className="w-3 h-3" />
                            </span>
                            <svg width="60" height="20" viewBox="0 0 60 20" fill="none" className="opacity-80">
                                <path d="M0 15C10 15 15 5 25 10C35 15 45 5 60 2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>

                    {/* Étudiants */}
                    <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between h-[130px]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 mb-0.5">Étudiants</h3>
                                <span className="text-3xl font-extrabold text-slate-800 leading-none block">{stats?.totalStudents ?? 248}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pl-1">
                            <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                                +18 ce mois <TrendingUp className="w-3 h-3" />
                            </span>
                            <svg width="60" height="20" viewBox="0 0 60 20" fill="none" className="opacity-80">
                                <path d="M0 15C10 15 15 5 25 10C35 15 45 5 60 2" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>

                    {/* Inscriptions */}
                    <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between h-[130px]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 mb-0.5">Inscriptions</h3>
                                <span className="text-3xl font-extrabold text-slate-800 leading-none block">342</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pl-1">
                            <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                                +25 ce mois <TrendingUp className="w-3 h-3" />
                            </span>
                            <svg width="60" height="20" viewBox="0 0 60 20" fill="none" className="opacity-80">
                                <path d="M0 15C10 15 15 5 25 10C35 15 45 5 60 2" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>

                    {/* Évaluations */}
                    <div className="bg-white rounded-[20px] border border-slate-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all flex flex-col justify-between h-[130px]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                                <ClipboardList className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-bold text-slate-500 mb-0.5">Évaluations</h3>
                                <span className="text-3xl font-extrabold text-slate-800 leading-none block">86</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pl-1">
                            <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                                +8 ce mois <TrendingUp className="w-3 h-3" />
                            </span>
                            <svg width="60" height="20" viewBox="0 0 60 20" fill="none" className="opacity-80">
                                <path d="M0 15C10 15 15 5 25 10C35 15 45 5 60 2" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Middle Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* Chart Section */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-extrabold text-slate-800">Vue d'ensemble</h2>
                            <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl px-4 py-2 outline-none cursor-pointer">
                                <option>7 derniers jours</option>
                                <option>30 derniers jours</option>
                                <option>Cette année</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-6 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                <span className="text-xs font-bold text-slate-500">Inscriptions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-xs font-bold text-slate-500">Vues</span>
                            </div>
                        </div>

                        <OverviewChart />
                        <div className="h-6" /> {/* spacer for x axis */}
                    </div>

                    {/* Recent Courses Section */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-extrabold text-slate-800">Mes cours récents</h2>
                            <Link href="/instructor/courses" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                Voir tout
                            </Link>
                        </div>

                        <div className="flex-1 space-y-4">
                            {recentCourses.length > 0 ? recentCourses.map((course, i) => {
                                const styles = [
                                    { bg: 'bg-gradient-to-br from-indigo-500 to-purple-500', text: 'text-white' },
                                    { bg: 'bg-gradient-to-br from-emerald-400 to-emerald-500', text: 'text-white' },
                                    { bg: 'bg-gradient-to-br from-orange-400 to-orange-500', text: 'text-white' },
                                ];
                                const C = styles[i % styles.length];
                                
                                return (
                                    <div key={course._id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 group">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${C.bg}`}>
                                            <BookOpen className={`w-6 h-6 ${C.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">{course.enrolledStudents?.length || (Math.floor(Math.random() * 100) + 10)} étudiants</p>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {course.isPublished ? (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-100/50">Publié</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-full border border-indigo-100/50">Brouillon</span>
                                            )}
                                            <button className="text-slate-400 hover:text-slate-700 transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div className="text-center py-10 text-slate-400 text-xs">Aucun cours trouvé.</div>
                            )}
                        </div>

                        <Link href="/instructor/courses" className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors w-full py-3 rounded-xl hover:bg-indigo-50">
                            Voir tous mes cours <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Calendrier */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                        <h2 className="text-lg font-extrabold text-slate-800 mb-6">Calendrier</h2>
                        
                        <div className="flex items-start gap-5">
                            <div className="bg-indigo-50 rounded-2xl p-3 flex flex-col items-center justify-center min-w-[70px] border border-indigo-100/50">
                                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">MAI</span>
                                <span className="text-2xl font-extrabold text-indigo-600 mt-1">18</span>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-700">Aujourd'hui</h3>
                                    <div className="flex gap-2">
                                        <button className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
                                        <button className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <span className="text-xs font-bold text-slate-400 w-10">10:00</span>
                                        <div className="flex-1 relative">
                                            <div className="absolute -left-2.5 top-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            <p className="text-xs font-bold text-slate-800">Cours en direct - React</p>
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Introduction aux Hooks</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <span className="text-xs font-bold text-slate-400 w-10">14:00</span>
                                        <div className="flex-1 relative">
                                            <div className="absolute -left-2.5 top-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <p className="text-xs font-bold text-slate-800">Correction des devoirs</p>
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">3 devoirs à corriger</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <span className="text-xs font-bold text-slate-400 w-10">16:00</span>
                                        <div className="flex-1 relative">
                                            <div className="absolute -left-2.5 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <p className="text-xs font-bold text-slate-800">Réunion avec les étudiants</p>
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Discussion générale</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tâches à faire */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-extrabold text-slate-800">Tâches à faire</h2>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                Voir tout
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 cursor-pointer group">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Corriger les devoirs</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">5 copies restantes</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            
                            <div className="flex items-center gap-3 cursor-pointer group">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Préparer le prochain cours</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">React - Composants avancés</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            </div>

                            <div className="flex items-center gap-3 cursor-pointer group">
                                <Circle className="w-5 h-5 text-slate-200 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Répondre aux messages</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">8 non lus</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            </div>

                            <div className="flex items-center gap-3 cursor-pointer group">
                                <Circle className="w-5 h-5 text-slate-200 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Créer un quiz</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">JavaScript - Variables</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Activité récente */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                        <h2 className="text-lg font-extrabold text-slate-800 mb-6">Activité récente</h2>
                        
                        <div className="space-y-6 relative before:absolute before:inset-y-2 before:left-3.5 before:w-px before:bg-slate-100">
                            
                            <div className="relative flex gap-4">
                                <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 z-10">
                                    <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-slate-700">Nouveau étudiant inscrit</p>
                                        <span className="text-[10px] font-bold text-slate-400">2h</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">Ahmed Ben Ali s'est inscrit à votre cours React</p>
                                </div>
                            </div>
                            
                            <div className="relative flex gap-4">
                                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 z-10">
                                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-slate-700">Devoir rendu</p>
                                        <span className="text-[10px] font-bold text-slate-400">4h</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">Mariam K. a rendu le devoir "Components"</p>
                                </div>
                            </div>

                            <div className="relative flex gap-4">
                                <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 z-10">
                                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-slate-700">Quiz complété</p>
                                        <span className="text-[10px] font-bold text-slate-400">6h</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">Youssef M. a complété le quiz "JS Basics"</p>
                                </div>
                            </div>

                            <div className="relative flex gap-4">
                                <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 z-10">
                                    <Mail className="w-3.5 h-3.5 text-orange-500" />
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-slate-700">Message reçu</p>
                                        <span className="text-[10px] font-bold text-slate-400">7h</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">Vous avez un nouveau message de Sarah J.</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </Sidebar>
    );
}
