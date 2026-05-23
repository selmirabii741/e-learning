'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { coursesAPI, adminAPI } from '@/lib/api';
import { Search, BookOpen, FileText, X, Loader2, Users, GraduationCap, User } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

export default function SearchModal({ open, onClose }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuthStore();
    const isAdmin = pathname?.includes('/admin');

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(0);
    const inputRef = useRef(null);
    const timer = useRef(null);

    useEffect(() => {
        if (open) {
            setQuery('');
            setResults([]);
            setSelected(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const performSearch = useCallback(async (q) => {
        if (!q.trim()) { setResults([]); return; }
        setLoading(true);
        try {
            const allResults = [];

            // 1. Search Courses & Lessons (Accessible by all)
            try {
                const { data } = await coursesAPI.search(q);
                if (data.results) {
                    allResults.push(...data.results.map(r => ({ ...r, category: r.type === 'course' ? 'Cours' : 'Leçons' })));
                }
            } catch (e) { console.error("Course search failed", e); }

            // 2. Search Users (Only for Admins to avoid leaking user data to students)
            if (isAdmin || user?.role === 'admin') {
                try {
                    const [studentsRes, teachersRes] = await Promise.all([
                        adminAPI.getStudents({ search: q }),
                        adminAPI.getTeachers({ search: q })
                    ]);
                    
                    if (teachersRes.data?.teachers) {
                        allResults.push(...teachersRes.data.teachers.map(t => ({
                            type: 'teacher', category: 'Professeurs', id: t._id, title: t.name, subtitle: t.email, excerpt: t.speciality
                        })));
                    }
                    if (studentsRes.data?.students) {
                        allResults.push(...studentsRes.data.students.map(s => ({
                            type: 'student', category: 'Étudiants', id: s._id, title: s.name, subtitle: s.email, excerpt: 'Inscrit le ' + new Date(s.createdAt).toLocaleDateString()
                        })));
                    }
                } catch (e) { console.error("User search failed", e); }
            }

            // Grouping logic is done at render time
            setResults(allResults);
            setSelected(0);
        } catch { 
            setResults([]); 
        } finally { 
            setLoading(false); 
        }
    }, [isAdmin, user]);

    useEffect(() => {
        clearTimeout(timer.current);
        if (query.length > 1) {
            timer.current = setTimeout(() => performSearch(query), 350);
        } else {
            setResults([]);
        }
        return () => clearTimeout(timer.current);
    }, [query, performSearch]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
            if (e.key === 'Enter' && results[selected]) { navigate(results[selected]); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, results, selected]);

    const navigate = (result) => {
        onClose();
        if (result.type === 'course') {
            router.push(isAdmin ? `/admin/courses` : `/courses/${result.courseId}`);
        } else if (result.type === 'lesson') {
            router.push(isAdmin ? `/admin/courses` : `/courses/${result.courseId}/learn`);
        } else if (result.type === 'teacher') {
            router.push(`/admin/teachers`);
        } else if (result.type === 'student') {
            router.push(`/admin/students`);
        }
    };

    const highlight = (text, q) => {
        if (!q || !text) return text;
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} style={{ background: 'rgba(217, 244, 91, 0.15)', color: '#4F46E5', borderRadius: '4px', padding: '0 2px', fontWeight: 700 }}>{part}</mark>
                : part
        );
    };

    if (!open) return null;

    // Group results by category
    const groupedResults = results.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {});

    const renderIcon = (type) => {
        if (type === 'course') return <BookOpen className="w-5 h-5 text-[#4F46E5]" />;
        if (type === 'lesson') return <FileText className="w-5 h-5 text-sky-500" />;
        if (type === 'teacher') return <GraduationCap className="w-5 h-5 text-indigo-500" />;
        if (type === 'student') return <User className="w-5 h-5 text-amber-500" />;
        return <Search className="w-5 h-5 text-[#8FA098]" />;
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -20 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed top-[8vh] inset-x-0 mx-auto z-[101] w-full max-w-3xl px-4"
                    >
                        <div className="overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-200" style={{ fontFamily: 'Inter, sans-serif' }}>
                            
                            {/* ── Input Area ── */}
                            <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                {loading
                                    ? <Loader2 className="w-6 h-6 text-[#4F46E5] animate-spin flex-shrink-0" />
                                    : <Search className="w-6 h-6 text-[#4F46E5] flex-shrink-0" />
                                }
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Rechercher un professeur, étudiant, cours ou leçon..."
                                    className="flex-1 bg-transparent outline-none text-white placeholder-slate-400 text-lg font-medium"
                                />
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {query && (
                                        <button onClick={() => setQuery('')} className="p-1 rounded-full text-[#8FA098] hover:text-[#B7C2B8] hover:bg-slate-200 transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                    <kbd className="hidden sm:flex items-center justify-center h-7 px-2 rounded-lg border border-slate-200 text-xs font-bold text-[#8FA098] bg-white shadow-sm">
                                        ESC
                                    </kbd>
                                </div>
                            </div>

                            {/* ── Results Area ── */}
                            <div className="max-h-[60vh] overflow-y-auto p-4" style={{ backgroundColor: '#ffffff' }}>
                                {query.length < 2 ? (
                                    <div className="px-6 py-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-[#4F46E5]" />
                                        </div>
                                        <p className="text-base font-semibold text-[#B7C2B8]">Commencez à taper pour rechercher</p>
                                        <p className="text-sm text-[#8FA098] mt-1">Trouvez rapidement n'importe quelle ressource ou utilisateur.</p>
                                    </div>
                                ) : results.length === 0 && !loading ? (
                                    <div className="px-6 py-16 text-center">
                                        <p className="text-base font-semibold text-[#B7C2B8]">Aucun résultat trouvé pour <span className="text-[#4F46E5]">"{query}"</span></p>
                                        <p className="text-sm text-[#8FA098] mt-1">Vérifiez l'orthographe ou essayez d'autres mots-clés.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {Object.entries(groupedResults).map(([category, items]) => (
                                            <div key={category}>
                                                <h3 className="text-xs font-bold text-[#8FA098] uppercase tracking-wider mb-2 px-3">{category}</h3>
                                                <div className="flex flex-col gap-1">
                                                    {items.map((result) => {
                                                        const globalIndex = results.findIndex(r => r === result);
                                                        const isSelected = selected === globalIndex;
                                                        return (
                                                            <button
                                                                key={`${result.type}-${result.id || result.courseId || result.title}`}
                                                                onClick={() => navigate(result)}
                                                                onMouseEnter={() => setSelected(globalIndex)}
                                                                className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all rounded-2xl ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                                                            >
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border ${isSelected ? 'border-indigo-100 shadow-indigo-100' : 'border-slate-100'}`}>
                                                                    {renderIcon(result.type)}
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-bold text-white truncate">
                                                                        {highlight(result.title, query)}
                                                                    </p>
                                                                    <p className="text-xs text-[#8FA098] font-medium truncate mt-0.5">{result.subtitle}</p>
                                                                    {result.excerpt && (
                                                                        <p className="text-xs text-[#8FA098] mt-1 line-clamp-1">
                                                                            {highlight(result.excerpt, query)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ── Footer ── */}
                            {results.length > 0 && (
                                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-6 text-xs text-[#8FA098] font-medium">
                                    <span className="flex items-center gap-1.5"><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm text-[#8FA098] font-bold">↑↓</kbd> Naviguer</span>
                                    <span className="flex items-center gap-1.5"><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm text-[#8FA098] font-bold">↵</kbd> Ouvrir</span>
                                    <span className="ml-auto flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-[#4F46E5] text-[#03150D]"></span>
                                        {results.length} résultat{results.length !== 1 ? 's' : ''} trouvé{results.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
