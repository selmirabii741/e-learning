'use client';
export default function ToggleSwitch({ checked, onChange, disabled }) {
    return (
        <button type="button" role="switch" aria-checked={checked} disabled={disabled}
            onClick={() => onChange?.(!checked)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50"
            style={{ background: checked ? 'var(--accent)' : 'var(--border-strong)' }}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}
