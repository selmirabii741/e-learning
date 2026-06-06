'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/authStore';

import UserAvatar from '@/components/ui/UserAvatar';
import LogoutModal from '@/components/ui/LogoutModal';
import { useLangStore } from '@/lib/i18n';
import SearchModal from '@/components/ui/SearchModal';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap,
    LogOut, Menu, Bell, User, Sun, Moon, MessageSquare,
    CheckCircle, BarChart2, MessagesSquare, Search,
    Calendar, ChevronLeft, ChevronRight, Gamepad2,
    Home, Book, ClipboardList, Megaphone, Bot, Sparkles, Folder, Settings, FileText,
    UserPlus, CheckSquare, Star, Mail
} from 'lucide-react';
import Link from 'next/link';
import { progressAPI, messagesAPI } from '@/lib/api';
import NetworkBackground from '@/components/ui/NetworkBackground';

// ─── Safe Role Check Helper ───
const checkUserRole = (user) => {
    if (!user) return { isAdmin: false, isInstructor: false, isStudent: true, role: 'student' };
    
    const roleValue = user.role || user.type || user.accountType || '';
    const roleStr = String(roleValue).toLowerCase();
    const nameStr = String(user.name || '').toLowerCase();
    
    const isAdmin = roleStr === 'admin' || 
                    nameStr.includes('admin') || 
                    (user.permissions && user.permissions.includes('admin'));
                    
    if (isAdmin) {
        return { isAdmin: true, isInstructor: false, isStudent: false, role: 'admin' };
    }
    
    const isInstructor = roleStr === 'instructor' || 
                         roleStr === 'teacher' || 
                         roleStr === 'professor';
                         
    if (isInstructor) {
        return { isAdmin: false, isInstructor: true, isStudent: false, role: 'instructor' };
    }
    
    return { isAdmin: false, isInstructor: false, isStudent: true, role: 'student' };
};

const getUserRoleLabel = (user, t) => {
    const { role } = checkUserRole(user);
    if (role === 'admin') {
        return 'Admin';
    }
    if (role === 'instructor') {
        return 'Professeur';
    }
    return t ? t('role.student') || 'Student' : 'Étudiant';
};

const getIconStylesByHref = (href, active) => {
    if (active) {
        return {
            wrapperClass: "bg-white text-indigo-600 dark:text-indigo-600 shadow-sm flex items-center justify-center rounded-[10px] w-8 h-8 transition-all duration-300 flex-shrink-0",
            iconClass: "w-[18px] h-[18px] text-indigo-600"
        };
    }
    
    const baseWrapper = "flex items-center justify-center rounded-[10px] w-8 h-8 transition-all duration-300 group-hover:scale-110 flex-shrink-0 ";
    const baseIcon = "w-[18px] h-[18px]";

    if (href === '/dashboard' || href === '/admin' || href === '/instructor/accueil') {
        return {
            wrapperClass: baseWrapper + "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400",
            iconClass: baseIcon
        };
    } else if (href === '/dashboard/my-courses' || href === '/instructor' || href === '/admin/courses') {
        return {
            wrapperClass: baseWrapper + "bg-violet-50/80 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
            iconClass: baseIcon
        };
    } else if (href === '/courses' || href === '/admin/teachers' || href === '/admin/students') {
        return {
            wrapperClass: baseWrapper + "bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
            iconClass: baseIcon
        };
    } else if (href === '/dashboard/statistics' || href === '/instructor/analytics' || href === '/admin/analytics') {
        return {
            wrapperClass: baseWrapper + "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
            iconClass: baseIcon
        };
    } else if (href === '/messages' || href === '/admin/notifications') {
        return {
            wrapperClass: baseWrapper + "bg-orange-50/80 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
            iconClass: baseIcon
        };
    } else if (href === '/forum' || href === '/admin/users') {
        return {
            wrapperClass: baseWrapper + "bg-fuchsia-50/80 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400",
            iconClass: baseIcon
        };
    } else if (href === '/chat' || href === '/admin/verifications') {
        return {
            wrapperClass: baseWrapper + "bg-sky-50/80 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400",
            iconClass: baseIcon
        };
    } else if (href === '/calendar') {
        return {
            wrapperClass: baseWrapper + "bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
            iconClass: baseIcon
        };
    } else if (href === '/games' || href === '/admin/reports') {
        return {
            wrapperClass: baseWrapper + "bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
            iconClass: baseIcon
        };
    } else {
        return {
            wrapperClass: baseWrapper + "bg-slate-50/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400",
            iconClass: baseIcon
        };
    }
};


function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const ref = useRef(null);
    const { user } = useAuthStore();

    useEffect(() => {
        const { isAdmin, isInstructor } = checkUserRole(user);
        if (isInstructor) {
            setNotifications([
                { id: 1, type: 'student', title: 'Nouvel étudiant inscrit', desc: "Ahmed Ben Ali s'est inscrit à votre cours React", time: 'Il y a 2 min', read: false, dateGroup: "AUJOURD'HUI" },
                { id: 2, type: 'assignment', title: 'Devoir rendu', desc: 'Mariam K. a rendu le devoir "Composants React"', time: 'Il y a 1 heure', read: false, dateGroup: "AUJOURD'HUI" },
                { id: 3, type: 'quiz', title: 'Quiz complété', desc: 'Youssef M. a complété le quiz "JS Basics"', time: 'Il y a 3 heures', read: false, dateGroup: "AUJOURD'HUI" },
                { id: 4, type: 'comment', title: 'Nouveau commentaire', desc: 'Sara J. a commenté le cours "Python pour débutants"', time: 'Hier, 18:45', read: true, dateGroup: "HIER" },
                { id: 5, type: 'message', title: 'Message reçu', desc: 'Vous avez un nouveau message de Sarah J.', time: 'Hier, 16:20', read: true, dateGroup: "HIER" },
            ]);
        } else if (!isAdmin) {
            progressAPI.getMyProgress().then(({ data }) => {
                const items = [];
                (data.progress || []).forEach((p) => {
                    const title = p.course?.title || 'Cours';
                    if (p.completionPercentage === 100) {
                        items.push({ id: Math.random(), type: 'success', title: 'Cours terminé', desc: title, time: 'Récent', read: false, dateGroup: "RÉCENT" });
                    } else if ((p.completedLessons?.length || 0) > 0) {
                        items.push({ id: Math.random(), type: 'info', title: 'Leçon complétée', desc: `${p.completedLessons.length} leçon(s) — ${title}`, time: 'Récent', read: false, dateGroup: "RÉCENT" });
                    }
                });
                setNotifications(items.slice(0, 5));
            }).catch(() => { });
        }
    }, [user]);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Group notifications by dateGroup
    const groupedNotifications = notifications.reduce((acc, curr) => {
        if (!acc[curr.dateGroup]) acc[curr.dateGroup] = [];
        acc[curr.dateGroup].push(curr);
        return acc;
    }, {});

    const getIcon = (type) => {
        switch (type) {
            case 'student': return <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><UserPlus className="w-5 h-5" /></div>;
            case 'assignment': return <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckSquare className="w-5 h-5" /></div>;
            case 'quiz': return <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><FileText className="w-5 h-5" /></div>;
            case 'comment': return <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><Star className="w-5 h-5" /></div>;
            case 'message': return <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Mail className="w-5 h-5" /></div>;
            case 'success': return <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle className="w-5 h-5" /></div>;
            default: return <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600"><Bell className="w-5 h-5" /></div>;
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(!open)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative ${open || unreadCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-sm border border-white">
                        {unreadCount}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 top-14 w-[420px] rounded-2xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {/* Arrow pointer */}
                    <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-slate-100 transform rotate-45"></div>

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                        <h3 className="font-extrabold text-[17px] text-slate-800">Notifications</h3>
                        <div className="flex items-center gap-3">
                            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                                <Settings className="w-4 h-4" />
                            </button>
                            <button className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors" onClick={() => {
                                setNotifications(notifications.map(n => ({ ...n, read: true })));
                            }}>
                                Tout marquer comme lu
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto bg-white">
                        {notifications.length === 0 ? (
                            <p className="text-center py-12 text-sm font-medium text-slate-400">Aucune notification</p>
                        ) : (
                            Object.entries(groupedNotifications).map(([group, items]) => (
                                <div key={group}>
                                    <div className="px-5 py-2.5">
                                        <span className="text-[11px] font-extrabold text-slate-400 tracking-wider">{group}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        {items.map((n, i) => (
                                            <div key={n.id} className={`flex items-start gap-4 px-5 py-3.5 relative transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}>
                                                {/* Left border for unread */}
                                                {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-md"></div>}

                                                {/* Icon */}
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getIcon(n.type)}
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className={`text-[14px] ${!n.read ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-[13px] text-slate-500 mt-0.5 truncate">
                                                        {n.desc}
                                                    </p>
                                                    <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                                                        {n.time}
                                                    </p>
                                                </div>

                                                {/* Unread Dot */}
                                                {!n.read && (
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-sm"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 border-t border-slate-100 bg-white hover:bg-slate-50 transition-colors cursor-pointer relative z-10">
                        <Link href="/dashboard" onClick={() => setOpen(false)}
                            className="text-[13px] font-bold text-indigo-600 flex items-center">
                            Voir toute l'activité <span className="ml-1 text-lg leading-none">→</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}



function CalendarDropdown() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const today = new Date();
    const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
    const firstDay = new Date(current.year, current.month, 1).getDay();
    const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const prev = () => setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
    const next = () => setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
    const isToday = (d) => d === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(o => !o)}
                className="topbar-icon-btn"
                title="Agenda"
            >
                <Calendar className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute right-0 top-11 w-72 rounded-2xl border shadow-xl z-50 overflow-hidden"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {MONTHS[current.month]} {current.year}
                        </p>
                        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-3">
                        <div className="grid grid-cols-7 mb-1">
                            {DAYS.map((d, i) => (
                                <div key={i} className="text-center text-[10px] font-bold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-0.5">
                            {cells.map((d, i) => (
                                <div key={i} className={`h-8 flex items-center justify-center text-xs rounded-lg transition-colors
                                    ${d ? 'cursor-pointer hover:bg-violet-500/15' : ''}
                                    ${isToday(d) ? 'bg-[#4F46E5] text-[#03150D] text-white font-bold shadow-lg shadow-violet-500/30' : ''}
                                `} style={{ color: d && !isToday(d) ? 'var(--text-secondary)' : undefined }}>
                                    {d || ''}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="px-4 py-2 border-t text-center" style={{ borderColor: 'var(--border)' }}>
                        <button onClick={() => setCurrent({ year: today.getFullYear(), month: today.getMonth() })}
                            className="text-xs text-[#4F46E5] hover:text-violet-300 transition-colors">
                            Aujourd'hui
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


function getAdminNav(t) {
    return [
        {
            title: 'Général', items: [
                { href: '/admin', icon: LayoutDashboard, label: 'Accueil' },
                { href: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
            ]
        },
        {
            title: 'Gestion', items: [
                { href: '/admin/users', icon: Users, label: 'Utilisateurs' },
                { href: '/admin/teachers', icon: GraduationCap, label: 'Professeurs' },
                { href: '/admin/students', icon: Users, label: 'Étudiants' },
                { href: '/admin/courses', icon: BookOpen, label: 'Cours' },
                { href: '/admin/verifications', icon: CheckCircle, label: 'Validation certificats' },
            ]
        },
        {
            title: 'Système', items: [
                { href: '/admin/reports', icon: FileText, label: 'Rapports' },
                { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
                { href: '/admin/settings', icon: Settings, label: 'Paramètres' },
            ]
        },
    ];
}

function getInstructorNav(t) {
    return [
        {
            title: 'Enseignement', items: [
                { href: '/instructor/accueil', icon: Home, label: 'Accueil', exact: true },
                { href: '/instructor', icon: BookOpen, label: t('nav.myCourses') || 'Mes cours' },
                { href: '/instructor/students', icon: Users, label: t('nav.myStudents') || 'Mes étudiants' },
                { href: '/instructor/analytics', icon: BarChart2, label: t('nav.analytics') || 'Analyses' },
            ]
        },
        {
            title: 'Social & Outils', items: [
                { href: '/instructor/requests', icon: CheckCircle, label: t('nav.requests') || 'Demandes' },
                { href: '/messages', icon: MessageSquare, label: t('nav.messages') || 'Messages' },
                { href: '/forum', icon: MessagesSquare, label: t('nav.forum') || 'Forum' },
                { href: '/calendar', icon: Calendar, label: 'Calendrier' },
            ]
        },
        {
            title: 'Système', items: [
                { href: '/profile', icon: Settings, label: t('nav.settings') || 'Paramètres' },
            ]
        }
    ];
}

function getStudentNav(t) {
    return [
        {
            title: 'Apprentissage', items: [
                { href: '/dashboard', icon: Home, label: 'Accueil', exact: true },
                { href: '/dashboard/my-courses', icon: BookOpen, label: 'Mes cours' },
                { href: '/courses', icon: Folder, label: 'Liste de cours' },
                { href: '/dashboard/statistics', icon: BarChart2, label: 'Progression' },
            ]
        },
        {
            title: 'Social & Outils', items: [
                { href: '/messages', icon: MessageSquare, label: 'Messages' },
                { href: '/forum', icon: MessagesSquare, label: 'Forum' },
                { href: '/chat', icon: Bot, label: 'Chat globale' },
                { href: '/calendar', icon: Calendar, label: 'Calendrier' },
                { href: '/games', icon: Gamepad2, label: 'Jeux de concentration' },
            ]
        },
        {
            title: 'Système', items: [
                { href: '/profile', icon: Settings, label: 'Paramètres' },
            ]
        }
    ];
}

export default function Sidebar({ children }) {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { t } = useLangStore();

    const [open, setOpen] = useState(false);
    const [dark, setDark] = useState(() => {
        if (typeof window === 'undefined') return true;
        return !document.documentElement.classList.contains('light');
    });
    const [unreadMsgs, setUnreadMsgs] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [sidebarPinnedExpanded, setSidebarPinnedExpanded] = useState(false);
    const [sidebarHoverExpanded, setSidebarHoverExpanded] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);




    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);


    useEffect(() => {
        if (!user) return;
        const fetchUnread = () =>
            messagesAPI.getUnreadCount().then(({ data }) => setUnreadMsgs(data.count)).catch(() => { });
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);


    useEffect(() => {
        // The blocking script in layout.js already set the correct class on <html>.
        // We just sync React state with what's already applied.
        const html = document.documentElement;
        const v = localStorage.getItem('theme_v');
        if (v !== '3') {
            localStorage.setItem('theme', 'dark');
            localStorage.setItem('theme_v', '3');
        }
        const saved = localStorage.getItem('theme');
        const isDark = saved !== 'light';
        setDark(isDark);
        // Ensure classes are correct (in case of client-side navigation)
        if (!html.classList.contains(isDark ? 'dark' : 'light')) {
            html.classList.add(isDark ? 'dark' : 'light');
            html.classList.remove(isDark ? 'light' : 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('light', !next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    const nav =
        user?.role === 'admin' ? getAdminNav(t) :
            user?.role === 'instructor' ? getInstructorNav(t) :
                getStudentNav(t);
    const isDesktopCompact = !sidebarPinnedExpanded && !sidebarHoverExpanded;
    const hideSearch = pathname.startsWith('/messages') ||
        pathname === '/instructor/accueil' ||
        pathname === '/dashboard' ||
        pathname === '/calendar' ||
        pathname === '/instructor/courses/new' ||
        pathname.includes('/learn');

    useEffect(() => {
        setSidebarPinnedExpanded(false);
        setSidebarHoverExpanded(false);
    }, [pathname]);

    const SidebarContent = ({ compact = false }) => (
        <div className="flex flex-col h-full bg-white dark:bg-[#0B0F19] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.02)] relative z-10 border-r border-slate-100 dark:border-white/5">
            {/* ── Logo ─── */}
            <div className={`py-6 flex items-center justify-between ${compact ? 'px-3' : 'px-6'} border-b border-slate-50 dark:border-white/[0.02]`}>
                <div className={`flex items-center ${compact ? 'justify-center w-full' : 'gap-3'}`}>
                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-[#4F46E5] via-[#6366F1] to-[#7C3AED] flex items-center justify-center shadow-[0_8px_20px_rgba(99,102,241,0.25)] flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    {!compact && (
                        <div className="flex flex-col">
                            <span className="font-extrabold text-[22px] leading-none tracking-tight text-slate-800 dark:text-slate-100" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Edu<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-600">AI</span>
                            </span>
                            <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 dark:text-slate-500 mt-1 whitespace-nowrap">
                                Learn &bull; Evolve &bull; Succeed
                            </span>
                        </div>
                    )}
                </div>
                {!compact && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setSidebarPinnedExpanded(false);
                        }}
                        className="hidden lg:flex w-7 h-7 rounded-full border border-slate-100 dark:border-slate-800/80 items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300"
                        title="Collapse Sidebar"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
                {compact && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setSidebarPinnedExpanded(true);
                        }}
                        className="hidden lg:flex w-7 h-7 rounded-full border border-slate-100 dark:border-slate-800/80 items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 mt-2 mx-auto"
                        title="Expand Sidebar"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
                <button className="lg:hidden transition-colors text-slate-400 hover:text-slate-600" onClick={() => setOpen(false)}>
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>

            {/* ── Navigation ── */}
            <nav className={`flex-1 py-4 overflow-y-auto ${compact ? 'px-2' : 'px-4'}`} style={{ scrollbarWidth: 'none' }}>
                {(!mounted ? getStudentNav(t) : nav).map((group, idx) => (
                    <div key={idx} className={compact ? 'mb-4' : 'mb-2'}>
                        {!compact && group.title && (
                            <p className="px-3 mb-2.5 mt-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {group.title}
                            </p>
                        )}
                        <div className="space-y-1.5">
                            {group.items.map(({ href, icon: Icon, label, exact }) => {
                                const active = exact ? pathname === href : (pathname === href || (href !== '/admin' && href !== '/dashboard' && href !== '/instructor' && pathname.startsWith(href)));
                                const isMessages = href === '/messages';
                                const isChat = href === '/chat';
                                const { wrapperClass, iconClass } = getIconStylesByHref(href, active);
                                return (
                                    <Link key={`${href}-${label}`} href={href} onClick={() => setOpen(false)} title={compact ? label : undefined}
                                        className={`flex items-center ${compact ? 'justify-center' : 'gap-3'} ${compact ? 'p-2.5' : 'px-4 py-3'} rounded-[20px] text-[14px] font-medium transition-all duration-300 group relative`}
                                        style={active ? {
                                            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #7C3AED 100%)',
                                            color: '#ffffff',
                                            fontWeight: 600,
                                            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.22)'
                                        } : {
                                            color: 'var(--text-secondary)',
                                        }}
                                        onMouseEnter={e => { 
                                            if (!active) { 
                                                e.currentTarget.style.background = 'var(--bg-hover)'; 
                                                e.currentTarget.style.color = 'var(--accent)'; 
                                            } 
                                        }}
                                        onMouseLeave={e => { 
                                            if (!active) { 
                                                e.currentTarget.style.background = 'transparent'; 
                                                e.currentTarget.style.color = 'var(--text-secondary)'; 
                                            } 
                                        }}
                                    >
                                        <div className={wrapperClass}>
                                            <Icon className={iconClass} />
                                        </div>
                                        {!compact && <span className="transition-colors duration-300">{label}</span>}
                                        {!compact && isMessages && (
                                            <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center bg-[#FF5D47] text-white shadow-[0_0_10px_rgba(255,93,71,0.4)]">
                                                {unreadMsgs || 3}
                                            </span>
                                        )}
                                        {!compact && isChat && (
                                            <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center bg-[#4F46E5] text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]">
                                                12
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── Bottom section ── */}
            <div className={compact ? 'p-3' : 'p-4'} style={{ borderTop: '1px solid var(--border)' }}>
                {/* User card */}
                {mounted && user && (
                    <div className={`rounded-[20px] flex items-center ${compact ? 'justify-center p-2' : 'gap-3 p-3'} border border-white/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] backdrop-blur-md shadow-md shadow-black/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.05] hover:border-slate-200 dark:hover:border-white/15 cursor-pointer transition-all duration-300`}
                        title={compact ? `${user.name} (${user.email})` : undefined}>
                        <div className="relative flex-shrink-0">
                            <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#6366F1] via-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold shadow-[0_4px_10px_rgba(99,102,241,0.25)] flex-shrink-0">
                                {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'RS'}
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            </div>
                        </div>
                        {!compact && (
                            <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-bold tracking-tight text-slate-800 dark:text-slate-100 truncate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {user.name}
                                </p>
                                <p className="text-[11px] truncate flex items-center mt-0.5">
                                    <span className="font-semibold text-[#10B981]">Online</span>
                                    <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1.5 font-medium">{getUserRoleLabel(user, t)}</span>
                                </p>
                            </div>
                        )}
                        {!compact && <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                    </div>
                )}

                {/* Logout */}
                <button onClick={() => setShowLogoutModal(true)} title={compact ? t('nav.logout') : undefined}
                    className={`flex items-center ${compact ? 'justify-center' : 'gap-3'} px-4 py-3.5 w-full rounded-[20px] text-[13px] font-semibold transition-all duration-300 mt-2 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100/50 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-[#FF5D47] dark:hover:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/20 hover:border-red-100/50 dark:hover:border-red-900/10 shadow-sm shadow-black/[0.01]`}
                >
                    <LogOut className="w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-1" />
                    {!compact && <span>{t('nav.logout') || 'Logout'}</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19]" style={{ position: 'relative' }}>
            <aside
                onMouseEnter={() => setSidebarHoverExpanded(true)}
                onMouseLeave={() => setSidebarHoverExpanded(false)}
                className="hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r border-slate-100 dark:border-white/5 relative z-30"
                style={{
                    width: isDesktopCompact ? 80 : 280,
                    background: 'var(--bg-sidebar, #ffffff)',
                }}>
                <SidebarContent compact={isDesktopCompact} />
            </aside>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-64 border-r transition-colors"
                        style={{
                            borderColor: '#eef2f6'
                        }}>
                        <SidebarContent compact={false} />
                    </aside>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>

                <header className="h-16 flex items-center gap-3 px-4 lg:px-6 flex-shrink-0"
                    style={{
                        background: 'var(--bg-card)',
                        borderBottom: '1px solid var(--border)',
                        position: 'sticky', top: 0, zIndex: 40
                    }}>

                    {/* Mobile menu trigger */}
                    <button className="lg:hidden flex-shrink-0" style={{ color: 'var(--text-secondary)' }} onClick={() => setOpen(true)}>
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Search bar */}
                    {!hideSearch && (
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="hidden lg:flex items-center gap-3 px-5 py-2.5 rounded-full text-[14px] flex-1 max-w-2xl text-left transition-all group"
                            style={{
                                background: '#ffffff',
                                border: '1px solid #E2E8F0',
                                color: '#94a3b8',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(154, 217, 75, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)'; }}
                        >
                            <Search className="w-4 h-4 text-[#8FA098] group-hover:text-[#4F46E5] transition-colors" />
                            <span className="flex-1 font-medium">Rechercher un professeur, étudiant, cours ou leçon...</span>
                            <div className="flex items-center gap-1">
                                <kbd className="flex items-center justify-center h-5 px-1.5 rounded-[6px] text-[10px] font-bold" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b' }}>⌘</kbd>
                                <kbd className="flex items-center justify-center h-5 px-1.5 rounded-[6px] text-[10px] font-bold" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b' }}>K</kbd>
                            </div>
                        </button>
                    )}

                    {/* Right-side icons */}
                    <div className="flex items-center gap-1.5 ml-auto">
                        {/* Mobile search */}
                        {!hideSearch && (
                            <button onClick={() => setSearchOpen(true)}
                                className="lg:hidden topbar-icon-btn">
                                <Search className="w-4 h-4" />
                            </button>
                        )}

                        {/* Calendar */}
                        <CalendarDropdown />


                        {/* Notifications */}
                        <NotificationBell />

                        {/* Theme toggle — icon only */}
                        <button
                            onClick={toggleTheme}
                            className="topbar-icon-btn"
                            title={(!mounted || dark) ? t('topbar.lightMode') : t('topbar.darkMode')}
                            suppressHydrationWarning
                        >
                            {(!mounted || dark)
                                ? <Sun className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                : <Moon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
                        </button>

                        {/* User avatar */}
                        {mounted && user && (
                            <div className="flex-shrink-0 ml-1">
                                <UserAvatar user={user} size="sm" showStatus isOnline />
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto animate-fade-in p-4 lg:p-5"
                    style={{ background: 'transparent' }}>
                    {children}
                </main>
            </div>
            <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
            <LogoutModal open={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={logout} t={t} />
            <NetworkBackground mode={(!mounted || dark) ? 'dark' : 'light'} />
        </div>
    );
}
