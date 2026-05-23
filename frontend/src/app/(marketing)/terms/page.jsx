'use client';
import Link from 'next/link';
import { GraduationCap, FileText, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const SECTIONS = [
    {
        title: '1. Acceptation des conditions',
        content: `En accédant à la plateforme EduAI et en utilisant ses services, vous acceptez d'être lié par les présentes conditions de service. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.`,
    },
    {
        title: '2. Description du service',
        content: `EduAI est une plateforme d'apprentissage en ligne qui propose des cours interactifs, des quiz adaptatifs générés par intelligence artificielle, un tuteur IA basé sur la technologie RAG, ainsi que des certifications à l'issue des parcours complétés.`,
    },
    {
        title: '3. Compte utilisateur',
        content: `Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités effectuées depuis votre compte. Vous vous engagez à nous notifier immédiatement de toute utilisation non autorisée de votre compte. EduAI ne pourra être tenu responsable des pertes résultant d'une utilisation non autorisée de vos identifiants.`,
    },
    {
        title: '4. Utilisation acceptable',
        content: `Vous vous engagez à utiliser EduAI uniquement à des fins légales et conformes aux présentes conditions. Il est interdit de : partager votre compte avec des tiers, copier ou distribuer le contenu des cours sans autorisation, tenter de perturber le fonctionnement de la plateforme, ou utiliser les services à des fins frauduleuses ou malveillantes.`,
    },
    {
        title: '5. Propriété intellectuelle',
        content: `Tout le contenu disponible sur EduAI (cours, vidéos, quiz, certifications, logos, interface) est la propriété exclusive d'EduAI ou de ses partenaires et est protégé par les lois sur la propriété intellectuelle. Toute reproduction, distribution ou utilisation commerciale sans autorisation écrite préalable est strictement interdite.`,
    },
    {
        title: '6. Certifications',
        content: `Les certifications délivrées par EduAI attestent de la complétion d'un cours sur notre plateforme. Elles ne constituent pas des diplômes officiels reconnus par des institutions d'État. EduAI se réserve le droit de révoquer une certification en cas de fraude ou de violation des présentes conditions.`,
    },
    {
        title: '7. Limitation de responsabilité',
        content: `EduAI met tout en œuvre pour assurer la disponibilité et la qualité de ses services, mais ne peut garantir un accès ininterrompu à la plateforme. En aucun cas EduAI ne pourra être tenu responsable de dommages indirects, accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser ses services.`,
    },
    {
        title: '8. Modifications des conditions',
        content: `EduAI se réserve le droit de modifier les présentes conditions à tout moment. Les modifications entrent en vigueur dès leur publication sur la plateforme. L'utilisation continue des services après publication constitue votre acceptation des nouvelles conditions.`,
    },
    {
        title: '9. Résiliation',
        content: `EduAI se réserve le droit de suspendre ou de résilier votre accès à la plateforme sans préavis en cas de violation des présentes conditions. Vous pouvez également supprimer votre compte à tout moment en nous contactant via la page de contact.`,
    },
    {
        title: '10. Droit applicable',
        content: `Les présentes conditions sont régies par le droit en vigueur en Tunisie. Tout litige relatif à l'utilisation de la plateforme sera soumis à la compétence exclusive des tribunaux compétents.`,
    },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-200 relative overflow-hidden">
            <Header />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/15 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-16">
                <div className="mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#8FA098] hover:text-teal-400 transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        Retour à l'accueil
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[#0f0f1a] border border-white/5 flex items-center justify-center shadow-xl">
                            <FileText className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xs text-teal-400 font-semibold uppercase tracking-widest mb-1">EduAI</p>
                            <h1 className="text-3xl font-bold text-white">Conditions de service</h1>
                        </div>
                    </div>
                    <p className="text-[#8FA098] text-sm">Dernière mise à jour : Mars 2026</p>
                </div>

                <div className="backdrop-blur-xl bg-[#0f0f1a]/70 border border-white/5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-8 space-y-7">
                    {SECTIONS.map((section, i) => (
                        <div key={i}>
                            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-teal-500 rounded-full inline-block flex-shrink-0" />
                                {section.title}
                            </h2>
                            <p className="text-[#8FA098] leading-relaxed text-sm pl-4">
                                {section.content}
                            </p>
                            {i < SECTIONS.length - 1 && (
                                <div className="border-t border-white/5 mt-7" />
                            )}
                        </div>
                    ))}

                    <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0a0a0f] border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <p className="text-xs text-[#8FA098] font-medium">
                            Des questions ?{' '}
                            <Link href="/contact" className="text-teal-400 hover:underline">Contactez-nous</Link>
                            {' '}·{' '}
                            <Link href="/privacy" className="text-teal-400 hover:underline">Politique de confidentialité</Link>
                        </p>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
