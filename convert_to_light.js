const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.jsx', 'utf8');

content = content.replace(/mode="dark"/g, 'mode="light"');

content = content.replace(/backgroundColor: '#020F0A'/g, "backgroundColor: '#F8FAFC'");
content = content.replace(/rgba\(2, 15, 10, 0\.8\)/g, "rgba(255, 255, 255, 0.9)");
content = content.replace(/rgba\(2, 15, 10, 0\.6\)/g, "#FFFFFF");
content = content.replace(/rgba\(20, 35, 20, 0\.65\)/g, "rgba(255, 255, 255, 0.8)");
content = content.replace(/rgba\(15, 35, 22, 0\.85\)/g, "#FFFFFF");
content = content.replace(/rgba\(15,35,22,0\.95\)/g, "rgba(255,255,255,0.95)");
content = content.replace(/linear-gradient\(180deg, rgba\(20,45,28,0\.92\), rgba\(8,24,15,0\.95\)\)/g, "#FFFFFF");

content = content.replace(/color: '#FFFFFF'/g, "color: '#0F172A'");
content = content.replace(/color: '#D0D7D2'/g, "color: '#475569'");
content = content.replace(/color: '#B7C2B8'/g, "color: '#64748B'");
content = content.replace(/color: '#A5B0A8'/g, "color: '#64748B'");
content = content.replace(/color: '#D8E2D8'/g, "color: '#475569'");

content = content.replace(/#D9F45B/g, "#4F46E5");
content = content.replace(/#9AD94B/g, "#6366F1");
content = content.replace(/rgba\(217, 244, 91,/g, "rgba(79, 70, 229,");
content = content.replace(/rgba\(217,244,91,/g, "rgba(79,70,229,");
content = content.replace(/rgba\(154, 217, 75,/g, "rgba(99, 102, 241,");

content = content.replace(/color: '#03150D'/g, "color: '#FFFFFF'");
content = content.replace(/color='#03150D'/g, "color='#FFFFFF'");

content = content.replace(/borderColor: 'rgba\(190, 242, 100, 0\.1\)'/g, "borderColor: 'rgba(0, 0, 0, 0.05)'");

content = content.replace(/color: '#020F0A'/g, "color: '#FFFFFF'");

fs.writeFileSync('frontend/src/app/page.jsx', content);
console.log('Done replacing colors in page.jsx');
