// ============================================================
// MEMORY GAME — Constants & Card Definitions
// ============================================================

/** Emoji sets used as card faces */
export const CARD_SETS = {
    science: ["⚗️", "🔬", "🧬", "🧪", "🔭", "💡", "🧲", "⚡", "🌡️", "🔋", "🧫", "🛸"],
    nature: ["🌸", "🦋", "🌊", "🦁", "🐬", "🌺", "🦜", "🍄", "🌙", "⭐", "🦚", "🐙"],
    food: ["🍕", "🍣", "🥑", "🍩", "🍜", "🥭", "🫐", "🥐", "🍦", "🧁", "🍋", "🍇"],
};

/** Difficulty configurations */
export const DIFFICULTIES = {
    easy: { pairs: 6, cols: 3, label: "Easy", time: 90 },
    medium: { pairs: 10, cols: 4, label: "Medium", time: 120 },
    hard: { pairs: 18, cols: 6, label: "Hard", time: 180 },
};

/** How long (ms) to show mismatched cards before flipping back */
export const FLIP_BACK_DELAY = 900;

/** Score bonuses */
export const SCORE = {
    matchBonus: 100,
    timeBonus: 2,    // points per second remaining
    perfectBonus: 500,  // if completed with minimum moves
};