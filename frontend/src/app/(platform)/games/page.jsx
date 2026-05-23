'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { Gamepad2, ArrowRight } from 'lucide-react';

/* ── Design Tokens (theme-aware) ───────────────────────────────────────── */
const T = {
    card: {
        bg: 'var(--bg-card)',
        border: '1.5px solid var(--border-strong)',
        radius: '16px',
        shadow: 'var(--card-shadow)',
        shadowHover: 'var(--card-shadow-hover)',
    },
    text: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
    },
    accent: 'var(--accent)',
    accentSoft: 'var(--accent-dim)',
};

const games = [
    {
        id: 'chess',
        name: 'Chess',
        description: 'Jouez aux échecs contre une IA — 3 niveaux de difficulté.',
        image: '/games/chess.png',
        difficulty: 'Facile',
        tags: ['Stratégie', 'IA'],
    },
    {
        id: 'memory',
        name: 'Memory',
        description: 'Testez votre mémoire en associant les paires le plus vite possible.',
        image: '/games/memory.png',
        difficulty: 'Facile',
        tags: ['Mémoire', 'Rapidité'],
    },
    {
        id: 'mindcrash',
        name: 'MindCrash',
        description: 'Mémorisez la séquence et affrontez une IA neuronale.',
        image: '/games/mindcrash.png',
        difficulty: 'Moyen',
        tags: ['Réflexes', 'Compétition'],
    },
    {
        id: 'scrabble',
        name: 'Scrabble',
        description: 'Formez des mots et marquez des points sur un plateau classique.',
        image: '/games/scrabble.png',
        difficulty: 'Facile',
        tags: ['Vocabulaire', 'Réflexion'],
    },
];

export default function GamesPage() {
    const router = useRouter();
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <Sidebar>
            <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '40px' }}>

                {/* ── Header ── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 36,
                    marginTop: 8
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--bg-card)', border: '1.5px solid var(--border-strong)',
                            boxShadow: 'var(--card-shadow)',
                        }}>
                            <Gamepad2 style={{ width: 28, height: 28, color: T.accent }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text.primary, letterSpacing: '-0.02em', marginBottom: 2 }}>
                                Espace Jeux
                            </h1>
                            <p style={{ fontSize: 14, color: T.text.muted }}>
                                Détendez-vous et stimulez votre esprit avec nos mini-jeux
                            </p>
                        </div>
                    </div>

                    {/* Stats Pill */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 20px', borderRadius: 16,
                        background: 'var(--bg-card)', border: '1.5px solid var(--border-strong)',
                        boxShadow: 'var(--card-shadow)',
                    }}>
                        <span style={{ fontSize: 24 }}>🔥</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: T.text.primary, lineHeight: 1.1 }}>12</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Parties jouées
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Games Grid ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 24,
                }}>
                    {games.map((game) => {
                        const isHovered = hoveredId === game.id;
                        return (
                            <button
                                key={game.id}
                                onClick={() => router.push(`/games/${game.id}`)}
                                onMouseEnter={() => setHoveredId(game.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                style={{
                                    padding: 0,
                                    borderRadius: T.card.radius,
                                    border: T.card.border,
                                    background: T.card.bg,
                                    boxShadow: isHovered ? T.card.shadowHover : T.card.shadow,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                                    transform: isHovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0) scale(1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}
                            >
                                {/* Banner Image with embedded badge */}
                                <div style={{
                                    height: 180,
                                    width: '100%',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <img 
                                        src={game.image} 
                                        alt={game.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                            transition: 'transform 0.4s ease',
                                            filter: 'saturate(0.72) brightness(0.72) contrast(1.02)'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to bottom, rgba(11,18,32,0.1), rgba(11,18,32,0.55))'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                        background: game.difficulty === 'Moyen' ? 'rgba(245,158,11,0.18)' : T.accentSoft,
                                        color: game.difficulty === 'Moyen' ? '#fbbf24' : '#86efac',
                                        padding: '4px 12px',
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        border: game.difficulty === 'Moyen' ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(34,197,94,0.35)'
                                    }}>
                                        {game.difficulty}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{
                                        fontSize: 18, fontWeight: 800, color: T.text.primary,
                                        marginBottom: 8,
                                    }}>
                                        {game.name}
                                    </h3>
                                    <p style={{
                                        fontSize: 13, color: T.text.secondary,
                                        lineHeight: 1.5, marginBottom: 20, flex: 1,
                                    }}>
                                        {game.description}
                                    </p>

                                    {/* Footer: Tags + Jouer */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {game.tags.map(tag => (
                                                <span key={tag} style={{
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11,
                                                    fontWeight: 600,
                                                    background: 'var(--bg-secondary)',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border)',
                                                }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 4,
                                            fontSize: 13, fontWeight: 700, color: T.accent,
                                            transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
                                            transition: 'all 0.2s',
                                        }}>
                                            Jouer <ArrowRight style={{ width: 14, height: 14 }} />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {/* ── Trophy Card (placed dynamically via CSS Grid) ── */}
                    <div style={{
                        gridColumn: '3',
                        alignSelf: 'end',
                        background: 'var(--bg-card)',
                        borderRadius: T.card.radius,
                        border: '1.5px solid var(--border-strong)',
                        padding: '28px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: 'var(--card-shadow)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Text and Button */}
                        <div style={{ flex: 1, position: 'relative', zIndex: 2, paddingRight: '12px' }}>
                            <h3 style={{
                                fontSize: 16, fontWeight: 700, color: T.text.primary,
                                lineHeight: 1.4, marginBottom: 20
                            }}>
                                Relevez des défis, améliorez-vous et gagnez des badges !
                            </h3>
                            <button style={{
                                background: 'linear-gradient(135deg, var(--accent-light), var(--accent))',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 16px',
                                fontSize: 13,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-accent)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(22, 163, 74, 0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.2)'; }}
                            >
                                Voir mes badges 🏅
                            </button>
                        </div>
                        
                        {/* Trophy Image */}
                        <div style={{
                            width: '110px',
                            height: '110px',
                            flexShrink: 0,
                            position: 'relative',
                            marginRight: '-10px'
                        }}>
                            <img 
                                src="/games/trophy.png" 
                                alt="Trophy" 
                                style={{ 
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '180px', 
                                    height: '180px', 
                                    maxWidth: 'none',
                                    objectFit: 'cover',
                                    opacity: 0.85,
                                    WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 65%)',
                                    maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 65%)',
                                }}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </Sidebar>
    );
}
