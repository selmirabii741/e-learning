'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminAPI, progressAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import {
    ArrowLeft, User, Mail, Calendar, BookOpen, Trophy,
    Loader2, TrendingUp, CheckCircle, Clock
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminStudentDetailPage() {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        adminAPI.getStudents({})
            .then(({ data }) => {
                const found = (data.students || []).find((s) => s._id === id);
                if (found) setStudent(found);
                else toast.error('Étudiant introuvable');
            })
            .catch(() => toast.error('Erreur chargement'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <Sidebar>
            <div className="flex justify-center py-24">
                <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
            </div>
        </Sidebar>
    );

    if (!student) return (
        <Sidebar>
            <div className="card text-center py-16">
                <p className="text-[#8FA098]">Étudiant introuvable</p>
                <Link href="/admin/students" className="btn-secondary mt-4 mx-auto w-fit">Retour</Link>
            </div>
        </Sidebar>
    );

    const joinDate = new Date(student.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <Sidebar>
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <Link href="/admin/students" className="btn-ghost px-3 py-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="page-title flex items-center gap-2">
                            <User className="w-6 h-6 text-sky-400" /> Profil étudiant
                        </h1>
                        <p className="page-subtitle">{student.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="card flex flex-col items-center text-center gap-3 py-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white">
                            {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg">{student.name}</h2>
                            <p className="text-[#8FA098] text-sm">{student.email}</p>
                        </div>
                        <span className={`badge-slate text-xs px-3 py-1 rounded-full ${student.isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {student.isActive ? 'Actif' : 'Inactif'}
                        </span>
                    </div>

                    <div className="card space-y-3">
                        <h3 className="font-semibold text-white text-sm">Informations</h3>
                        <div className="flex items-center gap-2 text-sm text-[#8FA098]">
                            <Mail className="w-4 h-4 text-[#8FA098] flex-shrink-0" />
                            <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#8FA098]">
                            <Calendar className="w-4 h-4 text-[#8FA098] flex-shrink-0" />
                            <span>Inscrit le {joinDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#8FA098]">
                            <BookOpen className="w-4 h-4 text-[#8FA098] flex-shrink-0" />
                            <span>{student.enrolledCourses?.length ?? 0} cours inscrits</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="card">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-teal-400" />
                            Cours inscrits ({student.enrolledCourses?.length ?? 0})
                        </h3>

                        {!student.enrolledCourses?.length ? (
                            <div className="text-center py-12">
                                <BookOpen className="w-10 h-10 text-[#B7C2B8] mx-auto mb-3" />
                                <p className="text-[#8FA098] text-sm">Aucun cours inscrit</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {student.enrolledCourses.map((course) => (
                                    <div key={course._id ?? course}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                                        <div className="w-10 h-10 rounded-xl bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-5 h-5 text-teal-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {course.title ?? 'Cours'}
                                            </p>
                                            {course.category && (
                                                <span className="badge-slate text-[10px] capitalize mt-1 inline-block">
                                                    {course.category}
                                                </span>
                                            )}
                                        </div>
                                        {course._id && (
                                            <Link href={`/courses/${course._id}`}
                                                className="btn-ghost text-xs px-3 py-1.5 flex-shrink-0">
                                                Voir
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
