'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import {
    ArrowLeft, Plus, Loader2, BookOpen, X, Save, Trash2,
    GripVertical, Edit3, Check, FileText, Upload, ChevronDown, ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const LEVELS = ['débutant', 'intermédiaire', 'avancé'];
const CATEGORIES = ['Programmation', 'Design', 'Marketing', 'IA', 'Mathématiques', 'Langue', 'Autre'];

export default function EditCoursePage() {
    const { id } = useParams();
    const router = useRouter();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: '', level: '', thumbnail: '' });
    const [newLesson, setNewLesson] = useState({ title: '', content: '' });
    const [addingLesson, setAddingLesson] = useState(false);
    const [deletingLesson, setDeletingLesson] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const [expandedLesson, setExpandedLesson] = useState(null);
    const [lessonEdits, setLessonEdits] = useState({});
    const fileInputRefs = useRef({});

    const load = useCallback(async () => {
        try {
            const { data } = await coursesAPI.getById(id);
            setCourse(data.course);
            setForm({
                title: data.course.title,
                description: data.course.description,
                category: data.course.category,
                level: data.course.level,
                thumbnail: data.course.thumbnail || '',
            });

            const edits = {};
            data.course.lessons?.forEach((l) => {
                edits[l._id] = { content: l.content || '', saving: false, uploadingPdf: false };
            });
            setLessonEdits(edits);
        } catch { toast.error('Cours introuvable'); router.push('/instructor'); }
        finally { setLoading(false); }
    }, [id, router]);

    useEffect(() => { load(); }, [load]);

    const saveInfo = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await coursesAPI.update(id, form);
            toast.success('Informations mises à jour');
            load();
        } catch { toast.error('Erreur mise à jour'); }
        finally { setSaving(false); }
    };



    const addLesson = async () => {
        if (!newLesson.title.trim()) return toast.error('Titre requis');
        setAddingLesson(true);
        try {
            await coursesAPI.addLesson(id, newLesson);
            toast.success('Leçon ajoutée !');
            setNewLesson({ title: '', content: '' });
            setShowAddForm(false);
            load();
        } catch { toast.error('Erreur ajout leçon'); }
        finally { setAddingLesson(false); }
    };

    const deleteLesson = async (lessonId) => {
        if (!confirm('Supprimer cette leçon ?')) return;
        setDeletingLesson(lessonId);
        try {
            await coursesAPI.deleteLesson(id, lessonId);
            toast.success('Leçon supprimée');
            load();
        } catch { toast.error('Erreur suppression'); }
        finally { setDeletingLesson(null); }
    };

    const saveLessonContent = async (lessonId) => {
        setLessonEdits((prev) => ({ ...prev, [lessonId]: { ...prev[lessonId], saving: true } }));
        try {
            await coursesAPI.updateLesson(id, lessonId, { content: lessonEdits[lessonId]?.content || '' });
            toast.success('Contenu sauvegardé et ingéré dans le RAG !');
            load();
        } catch { toast.error('Erreur sauvegarde'); }
        finally {
            setLessonEdits((prev) => ({ ...prev, [lessonId]: { ...prev[lessonId], saving: false } }));
        }
    };

    const handlePdfUpload = async (lessonId, file) => {
        if (!file) return;
        setLessonEdits((prev) => ({ ...prev, [lessonId]: { ...prev[lessonId], uploadingPdf: true } }));
        try {
            const { data } = await coursesAPI.uploadLessonPDF(id, lessonId, file);
            toast.success(data.message);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur upload PDF');
        } finally {
            setLessonEdits((prev) => ({ ...prev, [lessonId]: { ...prev[lessonId], uploadingPdf: false } }));

            if (fileInputRefs.current[lessonId]) fileInputRefs.current[lessonId].value = '';
        }
    };

    const toggleLesson = (lessonId) => {
        setExpandedLesson((prev) => (prev === lessonId ? null : lessonId));
    };

    if (loading) return (
        <Sidebar><div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div></Sidebar>
    );

    return (
        <Sidebar>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/instructor" className="btn-ghost px-3 py-2"><ArrowLeft className="w-4 h-4" /></Link>
                    <div>
                        <h1 className="font-bold text-white text-xl">Éditer le cours</h1>
                        <p className="text-sm text-[#8FA098] truncate max-w-xs">{course?.title}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/courses/${id}`} className="btn-ghost text-sm">
                        Voir le cours
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl">
                <div className="lg:col-span-2">
                    <form onSubmit={saveInfo} className="card space-y-5">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-teal-400" /> Informations générales
                        </h3>

                        <div>
                            <label className="input-label">Titre *</label>
                            <input required className="input"
                                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="input-label">Description *</label>
                            <textarea required rows={4} className="input resize-none"
                                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div>
                            <label className="input-label">URL Miniature</label>
                            <input className="input" placeholder="https://..." type="url"
                                value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Catégorie</label>
                                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Niveau</label>
                                <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                                    {LEVELS.map((l) => <option key={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</> : <><Save className="w-4 h-4" /> Sauvegarder</>}
                        </button>
                    </form>

                    <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${course?.isPublished
                        ? 'bg-indigo-500/10 border-indigo-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${course?.isPublished ? 'bg-indigo-400' : 'bg-amber-400'}`} />
                        <div>
                            <p className={`text-sm font-medium ${course?.isPublished ? 'text-indigo-400' : 'text-amber-400'}`}>
                                {course?.isPublished ? 'Cours publié' : 'Brouillon'}
                            </p>
                            <p className="text-xs text-[#8FA098] mt-0.5">
                                {course?.isPublished
                                    ? 'Les étudiants peuvent voir et s\'inscrire à ce cours.'
                                    : 'Ajoutez au moins une leçon pour publier automatiquement ce cours.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-[#8FA098]" /> Leçons ({course?.lessons?.length ?? 0})
                            </h3>
                            <button onClick={() => setShowAddForm(!showAddForm)} className="btn-secondary text-xs px-3 py-2">
                                <Plus className="w-3.5 h-3.5" /> Ajouter
                            </button>
                        </div>

                        {showAddForm && (
                            <div className="mb-4 p-4 rounded-xl bg-teal-600/10 border border-teal-500/20 space-y-3">
                                <p className="text-sm font-medium text-teal-300">Nouvelle leçon</p>
                                <input className="input" placeholder="Titre de la leçon *" value={newLesson.title}
                                    onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} />
                                <textarea rows={3} className="input resize-none text-xs"
                                    placeholder="Contenu texte (optionnel — vous pouvez aussi uploader un PDF après création)"
                                    value={newLesson.content}
                                    onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })} />
                                <div className="flex gap-3 items-end">
                                    <button onClick={addLesson} disabled={addingLesson} className="btn-primary px-4 py-2.5">
                                        {addingLesson ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Ajouter
                                    </button>
                                    <button onClick={() => setShowAddForm(false)} className="btn-ghost px-3 py-2.5">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {!course?.lessons?.length ? (
                            <div className="text-center py-10">
                                <BookOpen className="w-10 h-10 text-[#B7C2B8] mx-auto mb-3" />
                                <p className="text-[#8FA098] text-sm">Aucune leçon. Cliquez sur &quot;Ajouter&quot; pour commencer.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {course.lessons.map((lesson, i) => {
                                    const lessonState = lessonEdits[lesson._id] || { content: '', saving: false, uploadingPdf: false };
                                    const isExpanded = expandedLesson === lesson._id;
                                    const hasContent = !!(lesson.content);
                                    const hasPdf = !!(lesson.pdfUrl);

                                    return (
                                        <div key={lesson._id}
                                            className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden transition-colors hover:border-white/10">
                                            <div className="flex items-center gap-3 p-3">
                                                <div className="w-7 h-7 rounded-full bg-teal-600/20 flex items-center justify-center text-xs text-teal-400 font-bold flex-shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{lesson.title}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">

                                                        {hasContent && (
                                                            <span className="text-xs text-indigo-400 flex items-center gap-1">
                                                                <Check className="w-3 h-3" /> Contenu
                                                            </span>
                                                        )}
                                                        {hasPdf && (
                                                            <span className="text-xs text-blue-400 flex items-center gap-1">
                                                                <FileText className="w-3 h-3" /> {lesson.pdfUrl}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => toggleLesson(lesson._id)}
                                                        className="btn-ghost p-1.5 text-xs flex items-center gap-1 text-[#8FA098] hover:text-teal-400 transition-colors"
                                                        title="Éditer le contenu">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteLesson(lesson._id)}
                                                        disabled={deletingLesson === lesson._id}
                                                        className="btn-ghost p-1.5" title="Supprimer">
                                                        {deletingLesson === lesson._id
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                                                            : <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-3 bg-white/[0.01]">
                                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                                        <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-blue-300">Uploader un PDF</p>
                                                            <p className="text-xs text-[#8FA098]">Le texte sera extrait et ingéré automatiquement dans le tuteur IA</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                ref={(el) => { fileInputRefs.current[lesson._id] = el; }}
                                                                type="file"
                                                                accept=".pdf"
                                                                className="hidden"
                                                                id={`pdf-${lesson._id}`}
                                                                onChange={(e) => handlePdfUpload(lesson._id, e.target.files?.[0])}
                                                            />
                                                            <label
                                                                htmlFor={`pdf-${lesson._id}`}
                                                                className={`btn-secondary text-xs px-3 py-1.5 cursor-pointer flex items-center gap-1.5 ${lessonState.uploadingPdf ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                {lessonState.uploadingPdf
                                                                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Traitement...</>
                                                                    : <><Upload className="w-3 h-3" /> Choisir PDF</>}
                                                            </label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs text-[#8FA098] mb-1 block">
                                                            Contenu texte (ou éditer le texte extrait du PDF)
                                                        </label>
                                                        <textarea
                                                            rows={6}
                                                            className="input resize-none text-xs font-mono"
                                                            placeholder="Collez ou tapez le contenu de la leçon ici..."
                                                            value={lessonState.content}
                                                            onChange={(e) =>
                                                                setLessonEdits((prev) => ({
                                                                    ...prev,
                                                                    [lesson._id]: { ...prev[lesson._id], content: e.target.value },
                                                                }))
                                                            }
                                                        />
                                                        <div className="flex justify-end mt-2">
                                                            <button
                                                                onClick={() => saveLessonContent(lesson._id)}
                                                                disabled={lessonState.saving}
                                                                className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5">
                                                                {lessonState.saving
                                                                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Sauvegarde...</>
                                                                    : <><Save className="w-3 h-3" /> Sauvegarder le contenu</>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
