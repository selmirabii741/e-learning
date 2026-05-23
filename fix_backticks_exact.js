const fs = require('fs');
const path = 'c:\\Users\\rabie\\Downloads\\pfe\\elearning-main\\frontend\\src\\app\\(platform)\\courses\\[id]\\learn\\page.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the specific syntactically broken mobile progress block cleanly:
const targetStr = `<div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>\r\n                                             <div className="h-2 rounded-full transition-all duration-700"\r\n                                      {/* PDF Viewer */}\r\n                                     <div className="mb-6">`;

const replacementStr = `<div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>\r\n                                             <div className="h-2 rounded-full transition-all duration-700"\r\n                                                 style={{ width: \`\${pct}%\`, background: 'linear-gradient(90deg, #14b8a6, #6366f1)' }} />\r\n                                         </div>\r\n                                     </div>\r\n\r\n                                     {/* PDF Viewer */}\r\n                                     <div className="mb-6">`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    console.log('Fixed using CRLF target');
} else {
    // Try with LF in case file uses LF on Windows
    const targetStrLF = `<div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>\n                                             <div className="h-2 rounded-full transition-all duration-700"\n                                      {/* PDF Viewer */}\n                                     <div className="mb-6">`;
    const replacementStrLF = `<div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>\n                                             <div className="h-2 rounded-full transition-all duration-700"\n                                                 style={{ width: \`\${pct}%\`, background: 'linear-gradient(90deg, #14b8a6, #6366f1)' }} />\n                                         </div>\n                                     </div>\n\n                                     {/* PDF Viewer */}\n                                     <div className="mb-6">`;
    if (content.includes(targetStrLF)) {
        content = content.replace(targetStrLF, replacementStrLF);
        console.log('Fixed using LF target');
    } else {
        // Fallback robust regex
        const regex = /<div\s+className="h-2\s+rounded-full\s+overflow-hidden"\s+style=\{\{\s*background:\s*'rgba\(99,102,241,0\.12\)'\s*\}\}>\s*<div\s+className="h-2\s+rounded-full\s+transition-all\s+duration-700"\s*\{\/\*\s*PDF\s+Viewer\s*\/\/\}\s*<div\s+className="mb-6">/s;
        console.log('Target string not found directly. Let us try split matching.');
        // Let's replace line-by-line or locate index
        const lines = content.split(/\r?\n/);
        let foundIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('h-2 rounded-full overflow-hidden') && lines[i].includes('rgba(99,102,241,0.12)') && lines[i+1].includes('transition-all duration-700') && lines[i+2].includes('PDF Viewer')) {
                foundIndex = i;
                break;
            }
        }
        if (foundIndex !== -1) {
            lines.splice(foundIndex, 4, 
                `                                         <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.12)' }}>`,
                `                                             <div className="h-2 rounded-full transition-all duration-700"`,
                `                                                 style={{ width: \`\${pct}%\`, background: 'linear-gradient(90deg, #14b8a6, #6366f1)' }} />`,
                `                                         </div>`,
                `                                     </div>`,
                ``,
                `                                     {/* PDF Viewer */}`,
                `                                     <div className="mb-6">`
            );
            content = lines.join('\r\n');
            console.log('Fixed successfully using line split!');
        } else {
            console.log('Could not find matches in line split.');
        }
    }
}

fs.writeFileSync(path, content, 'utf8');
