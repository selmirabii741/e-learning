'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { coursesAPI } from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import { ArrowLeft, Plus, Loader2, BookOpen, X, Image as ImageIcon, Send, Save, FileText, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const LEVELS = ['débutant', 'intermédiaire', 'avancé'];
const CATEGORIES = ['Programmation', 'Design', 'Marketing', 'IA', 'Mathématiques', 'Langue', 'Autre'];

export default function NewCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: CATEGORIES[0], level: LEVELS[0], isPublished: true, lessons: [] });
    const [newLesson, setNewLesson] = useState({ title: '', content: '', pdfFile: null });
    const [expandedLesson, setExpandedLesson] = useState(null);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleLessonPdfChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setNewLesson({ ...newLesson, pdfFile: file });
        } else {
            toast.error('Veuillez sélectionner un fichier PDF valide');
            e.target.value = null; // reset
        }
    };

    const addLesson = () => {
        if (!newLesson.title) return toast.error('Titre de la leçon requis');
        setForm(f => ({ ...f, lessons: [...f.lessons, { ...newLesson, id: Date.now() }] }));
        setNewLesson({ title: '', content: '', pdfFile: null });
    };

    const removeLesson = (id) => {
        setForm(f => ({ ...f, lessons: f.lessons.filter(l => l.id !== id) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description) return toast.error('Titre et description requis');

        try {
            setLoading(true);
            const payload = {
                title: form.title,
                description: form.description,
                category: form.category,
                level: form.level,
                isPublished: form.isPublished,
                // On n'envoie pas le champ duration, et on map pour envoyer les infos de base (sans le fichier PDF pour le moment)
                lessons: form.lessons.map(l => ({
                    title: l.title,
                    content: l.content,
                    duration: 0 // Keep a default 0 to satisfy existing model constraints if needed
                }))
            };

            const { data } = await coursesAPI.create(payload);
            const courseId = data.course?._id;

            // Upload PDF files for lessons if they exist
            if (courseId) {
                // Because lessons are newly created, we need to fetch the course or assume their order matches
                // Wait, the API response might return the created lessons with their DB _ids.
                const createdLessons = data.course?.lessons || [];
                
                for (let i = 0; i < form.lessons.length; i++) {
                    const originalLesson = form.lessons[i];
                    const createdLesson = createdLessons[i];
                    
                    if (originalLesson.pdfFile && createdLesson) {
                        try {
                            const formData = new FormData();
                            formData.append('pdf', originalLesson.pdfFile);
                            await coursesAPI.uploadLessonPDF(courseId, createdLesson._id, formData);
                        } catch (err) {
                            console.error('Failed to upload PDF for lesson', originalLesson.title);
                            toast.error(`Échec de l'upload du PDF pour la leçon: ${originalLesson.title}`);
                        }
                    }
                }
            }

            toast.success('Cours créé avec succès !');
            router.push('/instructor');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de la création');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sidebar>
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 animate-fade-in" style={{ fontFamily: 'Inter, sans-serif' }}>
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/instructor" className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Créer un nouveau cours</h1>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">Partagez votre expertise avec des milliers d'étudiants.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={(e) => {
                                set('isPublished', false);
                                handleSubmit(e);
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                            disabled={loading}
                        >
                            <Save className="w-4 h-4 text-slate-400" />
                            Brouillon
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Publier le cours
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Colonne Principale */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Section Infos Générales */}
                        <div className="bg-white rounded-3xl p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
                            <h2 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" /> Informations générales
                            </h2>
                            
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Titre du cours</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => set('title', e.target.value)}
                                        placeholder="ex: Masterclass React 2026 - De Zéro à Pro"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-400"
                                    />
                                    <p className="text-[11px] font-medium text-slate-400 mt-2 text-right">{form.title.length}/60 caractères</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => set('description', e.target.value)}
                                        placeholder="Décrivez ce que les étudiants vont apprendre dans ce cours..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none placeholder:text-slate-400 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Catégorie</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => set('category', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Niveau</label>
                                        <select
                                            value={form.level}
                                            onChange={(e) => set('level', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer capitalize"
                                        >
                                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Programme & Leçons */}
                        <div className="bg-white rounded-3xl p-7 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" /> Programme du cours
                                </h2>
                                <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">{form.lessons.length} leçons</span>
                            </div>

                            {form.lessons.length > 0 ? (
                                <div className="space-y-3 mb-8">
                                    {form.lessons.map((lesson, idx) => (
                                        <div key={lesson.id} className="group border border-slate-100 bg-slate-50/50 rounded-2xl p-4 hover:border-indigo-100 hover:bg-white transition-all">
                                            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800">{lesson.title}</h4>
                                                        {lesson.pdfFile && <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1 mt-0.5"><CheckCircle2 className="w-3 h-3" /> PDF Attaché ({lesson.pdfFile.name})</span>}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeLesson(lesson.id); }} className="text-slate-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {expandedLesson === lesson.id && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in text-sm text-slate-600">
                                                    {lesson.content || "Aucun contenu textuel."}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl mb-8">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                                        <BookOpen className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-600">Aucune leçon pour le moment</h3>
                                    <p className="text-xs text-slate-400 mt-1">Commencez par ajouter la première leçon de votre programme.</p>
                                </div>
                            )}

                            {/* Formulaire Ajout Leçon */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">Ajouter une leçon</h3>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Titre de la leçon"
                                        value={newLesson.title}
                                        onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    />
                                    
                                    <textarea
                                        placeholder="Contenu texte de la leçon (optionnel)"
                                        value={newLesson.content}
                                        onChange={e => setNewLesson({ ...newLesson, content: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                                    />
                                    
                                    {/* Upload PDF Section */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Support de cours (PDF)</label>
                                        <div className="flex items-center gap-3">
                                            <label className="cursor-pointer border border-dashed border-slate-300 bg-white hover:bg-slate-50 transition-colors px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-slate-600 w-full">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                {newLesson.pdfFile ? newLesson.pdfFile.name : "Joindre un fichier PDF"}
                                                <input type="file" accept="application/pdf" className="hidden" onChange={handleLessonPdfChange} />
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addLesson}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                    >
                                        <Plus className="w-4 h-4" /> Ajouter cette leçon
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Colonne Sidebar Droite */}
                    <div className="space-y-6">
                        
                        {/* Image Upload Area */}
                        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100">
                            <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">Image de couverture</h3>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-600">Ajouter une image</span>
                                <span className="text-xs font-medium text-slate-400 mt-1">1920x1080 recommandé</span>
                            </div>
                        </div>

                        {/* Conseils */}
                        <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Info className="w-24 h-24 text-indigo-500" />
                            </div>
                            <h3 className="text-sm font-extrabold text-indigo-900 mb-3 relative z-10 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Conseils pour réussir
                            </h3>
                            <ul className="space-y-3 relative z-10">
                                <li className="text-xs font-medium text-indigo-800/80 leading-relaxed">
                                    <strong className="text-indigo-900">Titre accrocheur :</strong> Soyez clair sur ce que l'étudiant va accomplir.
                                </li>
                                <li className="text-xs font-medium text-indigo-800/80 leading-relaxed">
                                    <strong className="text-indigo-900">Structurez vos leçons :</strong> Commencez par les bases avant d'aborder la complexité.
                                </li>
                                <li className="text-xs font-medium text-indigo-800/80 leading-relaxed">
                                    <strong className="text-indigo-900">PDFs de qualité :</strong> Assurez-vous que vos supports soient lisibles et aérés.
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>

            </div>
        </Sidebar>
    );
}
