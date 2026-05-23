'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { coursesAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import {
    ArrowLeft, Users, Loader2, Mail, TrendingUp,
    BookOpen, CheckCircle, Clock
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CourseStudentsPage() {
    const { id } = useParams();
    const [courseTitle, setCourseTitle] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [courseRes, studentsRes] = await Promise.all([
                coursesAPI.getById(id),
                coursesAPI.getCourseStudents(id),
            ]);
            setCourseTitle(courseRes.data.course?.title || 'Cours');
            setStudents(studentsRes.data.students || []);
        } catch {
            toast.error('Erreur chargement');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    return (
        <Sidebar>
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Link href={`/instructor/courses/${id}/edit`} className="btn-ghost px-3 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="page-title flex items-center gap-2">
                            <Users className="w-6 h-6 text-teal-400" /> Étudiants inscrits
                        </h1>
                        <p className="page-subtitle truncate max-w-md">{courseTitle}</p>
                    </div>
                </div>
                <span className="badge-slate text-sm px-4 py-1.5">
                    {students.length} étudiant{students.length !== 1 ? 's' : ''}
                </span>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
                </div>
            ) : students.length === 0 ? (
                <div className="card text-center py-20 max-w-lg mx-auto">
                    <div className="w-20 h-20 rounded-2xl bg-teal-600/10 flex items-center justify-center mx-auto mb-5">
                        <Users className="w-10 h-10 text-teal-400/40" />
                    </div>
                    <h2 className="text-white font-semibold text-lg mb-2">Aucun étudiant inscrit</h2>
                    <p className="text-[#8FA098] text-sm">
                        Les étudiants apparaîtront ici dès qu&apos;ils s&apos;inscriront à ce cours.
                    </p>
                </div>
            ) : (
                <div className="card p-0 overflow-hidden">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Étudiant</th>
                                <th>Email</th>
                                <th>Progression</th>
                                <th>Leçons</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((s) => {
                                const pct = s.completionPercentage ?? 0;
                                const isComplete = pct === 100;
                                return (
                                    <tr key={s._id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                    {s.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-white text-sm">{s.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="flex items-center gap-1.5 text-sm text-[#8FA098]">
                                                <Mail className="w-3.5 h-3.5 text-[#8FA098]" />
                                                {s.email}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 min-w-[100px]">
                                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${isComplete ? 'bg-indigo-500' : 'bg-gradient-to-r from-teal-500 to-teal-500'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-[#8FA098] flex-shrink-0 w-9 text-right">
                                                    {pct}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="flex items-center gap-1.5 text-sm text-[#8FA098]">
                                                <BookOpen className="w-3.5 h-3.5 text-[#8FA098]" />
                                                {s.completedLessons ?? 0}/{s.totalLessons ?? '—'}
                                            </span>
                                        </td>
                                        <td>
                                            {isComplete ? (
                                                <span className="flex items-center gap-1 text-xs text-indigo-400">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Terminé
                                                </span>
                                            ) : pct > 0 ? (
                                                <span className="flex items-center gap-1 text-xs text-amber-400">
                                                    <TrendingUp className="w-3.5 h-3.5" /> En cours
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-[#8FA098]">
                                                    <Clock className="w-3.5 h-3.5" /> Non commencé
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Sidebar>
    );
}
