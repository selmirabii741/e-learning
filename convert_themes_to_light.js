const fs = require('fs');
let content = fs.readFileSync('update_themes.js', 'utf8');

// Global replacements for both loginFtl and registerFtl strings

// 1. Backgrounds & Core Colors
content = content.replace(/background-color: #020F0A !important;/g, "background-color: '#F8FAFC' !important;");
// Actually, CSS doesn't use quotes for colors, so:
content = content.replace(/background-color: '#F8FAFC' !important;/g, "background-color: #F8FAFC !important;");

content = content.replace(/color: #FFFFFF;/g, "color: #0F172A;");
content = content.replace(/color: #A5B0A8;/g, "color: #64748B;");

// 2. Grid Pattern (from green to indigo/gray)
content = content.replace(/rgba\(190, 242, 100, 0\.03\)/g, "rgba(79, 70, 229, 0.03)");

// 3. Radial gradients (from green to indigo/cyan)
content = content.replace(/rgba\(217, 244, 91, 0\.08\)/g, "rgba(79, 70, 229, 0.05)");
content = content.replace(/rgba\(154, 217, 75, 0\.05\)/g, "rgba(56, 189, 248, 0.05)");

// 4. Auth Card
content = content.replace(/background: rgba\(12, 22, 16, 0\.8\);/g, "background: #FFFFFF;");
content = content.replace(/border: 1px solid rgba\(217, 244, 91, 0\.15\);/g, "border: 1px solid rgba(79, 70, 229, 0.15);");
content = content.replace(/box-shadow: 0 30px 60px rgba\(0, 0, 0, 0\.6\);/g, "box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);");

// 5. Left Panel Text & Accent
content = content.replace(/color: #D9F45B;/g, "color: #4F46E5;");
content = content.replace(/color: #0F172A;/g, "color: #0F172A;"); // already done by global
content = content.replace(/background: #FFFFFF;/g, "background: #FFFFFF;"); // circle is white

// 6. Badges
content = content.replace(/border: 1px solid rgba\(217, 244, 91, 0\.2\);/g, "border: 1px solid rgba(79, 70, 229, 0.2);");

// 7. Form Labels
content = content.replace(/color: #A5B0A8;/g, "color: #64748B;"); // Already covered, but just in case
content = content.replace(/color: #8FA098;/g, "color: #64748B;");

// 8. Inputs
content = content.replace(/background: rgba\(255, 255, 255, 0\.03\);/g, "background: #FFFFFF;");
content = content.replace(/border: 1px solid rgba\(255, 255, 255, 0\.1\);/g, "border: 1px solid #E2E8F0;");
content = content.replace(/border-color: rgba\(217, 244, 91, 0\.5\);/g, "border-color: #4F46E5;");
content = content.replace(/box-shadow: 0 0 0 4px rgba\(217, 244, 91, 0\.1\);/g, "box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);");

// 9. Input Icons
content = content.replace(/color: rgba\(255, 255, 255, 0\.4\);/g, "color: #94A3B8;");

// 10. Role selectors
content = content.replace(/border: 1px solid rgba\(255, 255, 255, 0\.1\);/g, "border: 1px solid #E2E8F0;"); // Re-replace in case 
content = content.replace(/border-color: #D9F45B;/g, "border-color: #4F46E5;");
content = content.replace(/background: rgba\(217, 244, 91, 0\.05\);/g, "background: rgba(79, 70, 229, 0.05);");

// 11. Buttons
content = content.replace(/background: #D9F45B;/g, "background: #4F46E5;");
content = content.replace(/color: #03150D;/g, "color: #FFFFFF;");
content = content.replace(/box-shadow: 0 0 20px rgba\(217, 244, 91, 0\.3\);/g, "box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);");
content = content.replace(/box-shadow: 0 0 30px rgba\(217, 244, 91, 0\.5\);/g, "box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4);");
// Secondary links
content = content.replace(/color: #D9F45B;/g, "color: #4F46E5;");
content = content.replace(/color: #EAF2EC;/g, "color: #475569;"); // "Vous avez déjà un compte ?"

// 12. Fix 'EduAI' logo text in header
content = content.replace(/#D9F45B/g, "#4F46E5");

// 13. Remove any remaining lime glow textShadow
content = content.replace(/text-shadow: 0 0 20px rgba\(217, 244, 91, 0\.3\);/g, "text-shadow: none;");

// Write back
fs.writeFileSync('update_themes.js', content);
console.log('Update themes converted to light mode');
