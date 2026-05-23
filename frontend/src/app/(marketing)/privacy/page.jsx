'use client';
import Link from 'next/link';
import { GraduationCap, Shield, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PrivacyPage() {
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
                            <Shield className="w-6 h-6 text-teal-400" />
                        </div>
                        <div>
                            <p className="text-xs text-teal-400 font-semibold uppercase tracking-widest mb-1">EduAI</p>
                            <h1 className="text-3xl font-bold text-white">Politique de confidentialité</h1>
                        </div>
                    </div>

                    <p className="text-[#8FA098] text-sm">Dernière mise à jour : Mars 2026</p>
                </div>

                <div className="backdrop-blur-xl bg-[#0f0f1a]/70 border border-white/5 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-8 space-y-8">

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-teal-500 rounded-full inline-block" />
                            1. Collecte des données
                        </h2>
                        <p className="text-[#8FA098] leading-relaxed text-sm">
                            EduAI collecte uniquement les données personnelles strictement nécessaires au bon fonctionnement de la plateforme.
                            Cela inclut votre adresse e-mail, votre nom et les informations de votre compte Google ou GitHub
                            lorsque vous choisissez de vous connecter via ces services.
                        </p>
                    </section>

                    <div className="border-t border-white/5" />

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-teal-500 rounded-full inline-block" />
                            2. Utilisation des données
                        </h2>
                        <p className="text-[#8FA098] leading-relaxed text-sm mb-4">
                            Vos données personnelles sont utilisées <strong className="text-slate-300">uniquement</strong> aux fins suivantes :
                        </p>
                        <ul className="space-y-2">
                            {[
                                'Authentification et sécurisation de votre compte',
                                'Envoi de notifications relatives à votre progression et vos cours',
                                'Personnalisation de votre expérience d\'apprentissage',
                                'Support technique et réponse à vos demandes',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-[#8FA098]">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <div className="border-t border-white/5" />

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-teal-500 rounded-full inline-block" />
                            3. Partage des données
                        </h2>
                        <p className="text-[#8FA098] leading-relaxed text-sm">
                            Nous ne vendons, ne louons et ne partageons <strong className="text-slate-300">jamais</strong> vos données personnelles
                            avec des tiers à des fins commerciales. Vos données restent strictement confidentielles
                            et ne sont accessibles qu'aux services essentiels au fonctionnement de la plateforme
                            (authentification via Keycloak, stockage sécurisé).
                        </p>
                    </section>

                    <div className="border-t border-white/5" />

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-teal-500 rounded-full inline-block" />
                            4. Conservation des données
                        </h2>
                        <p className="text-[#8FA098] leading-relaxed text-sm">
                            Vos données sont conservées aussi longtemps que votre compte est actif sur la plateforme.
                            Vous pouvez demander la suppression de votre compte et de toutes vos données à tout moment
                            en nous contactant à <a href="mailto:contact@eduai.com" className="text-teal-400 hover:underline">contact@eduai.com</a>.
                        </p>
                    </section>

                    <div className="border-t border-white/5" />

                    <section>
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-teal-500 rounded-full inline-block" />
                            5. Vos droits
                        </h2>
                        <p className="text-[#8FA098] leading-relaxed text-sm">
                            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression
                            et de portabilité de vos données. Pour exercer ces droits, contactez-nous via la{' '}
                            <Link href="/contact" className="text-teal-400 hover:underline">page de contact</Link>.
                        </p>
                    </section>

                    <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0a0a0f] border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <p className="text-xs text-[#8FA098] font-medium">
                            Authentification sécurisée par <span className="text-teal-400 font-semibold">Keycloak</span>
                        </p>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
