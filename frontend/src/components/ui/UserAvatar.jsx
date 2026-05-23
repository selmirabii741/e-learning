'use client';

/* ═══════════════════════════════════════════════════════════════════════════
   UserAvatar — Premium SaaS-grade avatar component
   ─ Soft gradient backgrounds, subtle ring + shadow, refined typography,
     optional online-status indicator dot.
═══════════════════════════════════════════════════════════════════════════ */

const SIZES = {
    xs: { px: 28, font: 10, ring: 1.5, statusDot: 7, statusBorder: 1.5, radius: '50%' },
    sm: { px: 36, font: 12, ring: 2, statusDot: 9, statusBorder: 2, radius: '50%' },
    md: { px: 44, font: 14, ring: 2, statusDot: 11, statusBorder: 2, radius: '50%' },
    lg: { px: 64, font: 22, ring: 2.5, statusDot: 14, statusBorder: 2.5, radius: 14 },
    xl: { px: 80, font: 28, ring: 3, statusDot: 16, statusBorder: 3, radius: 16 },
};

/* ── Gradient palette — deterministic from initials ───────────────────── */
const GRADIENTS = [
    ['#6366f1', '#6366F1'],   // indigo → violet
    ['#0ea5e9', '#6366f1'],   // sky → indigo
    ['#14b8a6', '#0ea5e9'],   // teal → sky
    ['#f43f5e', '#f97316'],   // rose → orange
    ['#6366F1', '#ec4899'],   // violet → pink
    ['#059669', '#22c55e'],   // emerald → green
    ['#d946ef', '#6366f1'],   // fuchsia → indigo
    ['#f59e0b', '#ef4444'],   // amber → red
];

const GREEN_GRADIENT = ['#16a34a', '#22c55e'];

function pickGradient(name) {
    if (!name) return GRADIENTS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function UserAvatar({
    user,
    size = 'md',
    className = '',
    variant = 'default',
    showStatus = false,
    isOnline = false,
}) {
    const s = SIZES[size] || SIZES.md;
    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';
    const src = user?.avatar;
    const [from, to] = variant === 'green' ? GREEN_GRADIENT : pickGradient(user?.name);

    /* ── Shared wrapper styles ──────────────────────────────────────────── */
    const wrapperStyle = {
        position: 'relative',
        width: s.px,
        height: s.px,
        flexShrink: 0,
    };

    /* ── Ring + shadow that wraps the avatar ────────────────────────────── */
    const ringStyle = {
        width: s.px,
        height: s.px,
        borderRadius: s.radius,
        overflow: 'hidden',
        boxShadow: `0 0 0 ${s.ring}px rgba(255,255,255,0.10), 0 2px 8px rgba(0,0,0,0.18)`,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    };

    /* ── Status indicator dot ───────────────────────────────────────────── */
    const StatusDot = () =>
        showStatus ? (
            <span
                style={{
                    position: 'absolute',
                    bottom: size === 'xs' ? -1 : 0,
                    right: size === 'xs' ? -1 : 0,
                    width: s.statusDot,
                    height: s.statusDot,
                    borderRadius: '50%',
                    background: isOnline
                        ? 'linear-gradient(135deg, #22c55e, #4ade80)'
                        : 'linear-gradient(135deg, #6b7280, #9ca3af)',
                    border: `${s.statusBorder}px solid var(--bg-card, #0d1220)`,
                    boxShadow: isOnline
                        ? '0 0 6px rgba(34,197,94,0.5)'
                        : '0 0 4px rgba(0,0,0,0.25)',
                    zIndex: 2,
                }}
            />
        ) : null;

    /* ── Fallback (gradient + initials) ─────────────────────────────────── */
    const FallbackContent = ({ style = {} }) => (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${from}, ${to})`,
                fontSize: s.font,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: s.font >= 22 ? '-0.02em' : '0.02em',
                fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                userSelect: 'none',
                ...style,
            }}
        >
            {initials}
        </div>
    );

    /* ── With avatar image ─────────────────────────────────────────────── */
    if (src) {
        return (
            <div style={wrapperStyle} className={className}>
                <div style={ringStyle}>
                    <img
                        src={src}
                        alt={user?.name || 'Avatar'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <FallbackContent style={{ display: 'none' }} />
                </div>
                <StatusDot />
            </div>
        );
    }

    /* ── Without avatar (initials only) ────────────────────────────────── */
    return (
        <div style={wrapperStyle} className={className}>
            <div style={ringStyle}>
                <FallbackContent />
            </div>
            <StatusDot />
        </div>
    );
}
