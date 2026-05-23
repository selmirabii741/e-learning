'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { authAPI } from '@/lib/api';
import { Upload, Clock, CheckCircle, XCircle, FileText, LogOut, RefreshCw, GraduationCap, Bot, Award, TrendingUp, BookOpen } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function PendingApprovalPage() {
  const { user, logout } = useAuthStore();
  const [verification, setVerification] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchVerification = useCallback(async () => {
    try {
      const { data } = await authAPI.getMyVerification();
      setVerification(data);
    } catch {
      // Not yet submitted
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVerification(); }, [fetchVerification]);

  const handleUpload = async () => {
    if (!file) return toast.error('Veuillez sélectionner un fichier.');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      await authAPI.uploadCertificate(formData);
      toast.success('Certificat envoyé avec succès !');
      setFile(null);
      await fetchVerification();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const status = verification?.status || user?.status || 'pending';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const hasUploaded = !!verification?.verification;

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
        
        {/* LEFT COLUMN - FORM */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16" style={{ background: '#FFFFFF', position: 'relative', zIndex: 10 }}>
          
          <div className="w-full max-w-[500px]">
            {/* Logo */}
            <div className="mb-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-[0_8px_24px_rgba(79,70,229,0.25)]" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                  <GraduationCap size={24} color="#fff" />
                </div>
                <div>
                  <div className="font-[800] text-[1.5rem] tracking-tight text-[#0F172A] leading-tight">
                    Edu<span className="text-transparent bg-clip-text bg-gradient-to-br from-[#4F46E5] to-[#9333EA]">AI</span>
                  </div>
                  <div className="text-[0.8rem] font-[600] text-[#64748B]">Espace Professeur</div>
                </div>
              </div>
            </div>

            {/* Status Header */}
            <div className="mb-8 text-center lg:text-left">
              <h1 className="text-[2rem] font-[800] tracking-tight text-[#0F172A] mb-3">
                {isPending ? 'Validation en attente' : 'Demande rejetée'}
              </h1>
              <p className="text-[1rem] leading-[1.6] text-[#475569]">
                {isPending && hasUploaded
                  ? 'Votre profil est en cours d\'examen par notre équipe administrative. Nous vous tiendrons informé.'
                  : isPending && !hasUploaded
                  ? 'Afin de finaliser la création de votre compte professeur, veuillez importer votre certificat ou diplôme.'
                  : 'Votre demande a été rejetée. Veuillez vérifier les remarques et soumettre un nouveau document.'}
              </p>
            </div>

            {/* Rejection comment */}
            {isRejected && verification?.verification?.adminComment && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] border-l-4 border-l-[#EF4444] rounded-xl p-4 mb-8 text-[0.9rem] text-[#DC2626]">
                <strong className="font-[700] mb-1 block">Commentaire de l'administrateur :</strong>
                {verification.verification.adminComment}
              </div>
            )}

            {/* Upload Zone */}
            {(!hasUploaded || isRejected) && (
              <div className="mb-6">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('cert-input').click()}
                  className="rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 relative overflow-hidden"
                  style={{
                    border: `2px dashed ${dragOver ? '#6366F1' : '#CBD5E1'}`,
                    background: dragOver ? 'rgba(99,102,241,0.04)' : '#F8FAFC',
                  }}
                >
                  <input
                    id="cert-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <Upload size={32} className="mx-auto mb-4" style={{ color: dragOver ? '#6366F1' : '#94A3B8' }} />
                  {file ? (
                    <div className="font-[600] text-[0.95rem] text-[#4F46E5] flex items-center justify-center gap-2">
                      <FileText size={18} /> {file.name}
                    </div>
                  ) : (
                    <>
                      <p className="font-[600] text-[1rem] text-[#475569] mb-1">
                        Glissez votre certificat ici ou <span className="text-[#4F46E5] hover:underline">parcourez</span>
                      </p>
                      <p className="text-[0.85rem] font-[500] text-[#94A3B8]">
                        Format PDF, PNG, JPG (Max 10 Mo)
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full mt-6 py-4 rounded-xl font-[800] text-[1rem] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(79,70,229,0.25)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.35)] hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#FFFFFF' }}
                >
                  {uploading ? 'Envoi en cours...' : (
                    <>Envoyer pour validation <CheckCircle size={18} /></>
                  )}
                </button>
              </div>
            )}

            {/* Waiting Status */}
            {hasUploaded && isPending && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-5 flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
                  <Clock size={24} className="text-[#D97706]" />
                </div>
                <div>
                  <h3 className="font-[800] text-[1.05rem] text-[#92400E]">Examen en cours</h3>
                  <p className="text-[0.9rem] font-[500] text-[#B45309] mt-0.5">
                    Fichier : {verification?.verification?.certificateName}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-[#E2E8F0]">
              <button
                onClick={() => { fetchVerification(); toast.success('Statut mis à jour'); }}
                className="flex-1 py-3.5 rounded-xl font-[700] text-[0.95rem] flex items-center justify-center gap-2 transition-colors bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
              >
                <RefreshCw size={16} /> Rafraîchir
              </button>
              <button
                onClick={logout}
                className="flex-1 py-3.5 rounded-xl font-[700] text-[0.95rem] flex items-center justify-center gap-2 transition-colors bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - IMAGE & GRAPHICS */}
        <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden" style={{ background: '#F8FAFC' }}>
          {/* Background Gradient & Blur */}
          <div className="absolute top-0 right-0 w-full h-full" style={{ background: 'radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)' }} />
          <div className="absolute bottom-0 left-0 w-full h-full" style={{ background: 'radial-gradient(circle at 30% 70%, rgba(124, 58, 237, 0.15) 0%, transparent 60%)' }} />

          <div className="relative w-[550px] h-[550px] mx-auto z-10">
            {/* Circular Background behind image */}
            <div className="absolute inset-0 rounded-full blur-[60px] opacity-20" style={{ backgroundColor: '#6366F1' }} />
            <div className="absolute inset-4 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.05))', border: '1px solid rgba(79, 70, 229, 0.2)' }} />

            <img 
              src="/images/hero-student.png" 
              alt="Instructor dashboard" 
              className="absolute inset-0 w-full h-full object-cover rounded-full p-4" 
              onError={(e) => e.target.style.display = 'none'} 
            />

            {/* Floating Card 1: Tuteur IA */}
            <motion.div animate={{ y: [-12, 12, -12] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} 
              className="absolute top-16 -left-12 p-4 pr-6 rounded-2xl flex items-center gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.08)] bg-white/90 backdrop-blur-md border border-indigo-100"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <p className="font-[800] text-[1.1rem] text-slate-800">Tuteur IA</p>
                <p className="text-[0.85rem] font-[600] text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Toujours disponible
                </p>
              </div>
            </motion.div>

            {/* Floating Card 2: Suivi de progression */}
            <motion.div animate={{ y: [12, -12, 12] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} 
              className="absolute bottom-28 -right-8 p-4 pr-6 rounded-2xl flex items-center gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.08)] bg-white/90 backdrop-blur-md border border-blue-100"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="font-[800] text-[1.1rem] text-slate-800">Suivi progression</p>
                <p className="text-[0.85rem] font-[600] text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Analysez vos stats
                </p>
              </div>
            </motion.div>

            {/* Floating Card 3: Ressources */}
            <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} 
              className="absolute bottom-6 -left-8 p-4 pr-6 rounded-2xl flex items-center gap-4 shadow-[0_15px_40px_rgba(0,0,0,0.08)] bg-white/90 backdrop-blur-md border border-emerald-100"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="font-[800] text-[1.1rem] text-slate-800">Ressources</p>
                <p className="text-[0.85rem] font-[600] text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Contenu de qualité
                </p>
              </div>
            </motion.div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </>
  );
}
