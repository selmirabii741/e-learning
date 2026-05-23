const fs = require('fs');
let code = fs.readFileSync('c:\\\\Users\\\\rabie\\\\Desktop\\\\ai-tutor\\\\app\\\\page.tsx', 'utf8');

// 1. MsgContent colors
code = code.replace(/color: '#f1f5f9'/g, "color: '#111827'");

// 2. T object
code = code.replace(/const T = \\{[\\s\\S]*?bg: '#09090b'[\\s\\S]*?red: '#ef4444',\\n  \\}/, `const T = {
    bg: '#ffffff', surface: '#fdfdfd', surfaceHigh: '#f3f4f6',
    border: '#e5e7eb', borderM: '#d1d5db',
    text: '#111827', textMuted: '#6b7280', textSub: '#4b5563',
    accent: '#000000', accentL: '#374151', accentGlow: 'rgba(0,0,0,0.04)',
    green: '#10b981', red: '#ef4444',
  }`);

// 3. CSS
code = code.replace(/<style>\\{\`[\\s\\S]*?\`\\}<\\/style>/, \`<style>{\\\`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:5px}
        ::-webkit-scrollbar-thumb:hover{background:#9ca3af}
        @keyframes dot{0%,100%{opacity:.3;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        .hov:hover{background:rgba(0,0,0,0.04)!important}
        .src-row:hover{background:rgba(0,0,0,0.02)!important}
        .sess-row:hover{background:rgba(0,0,0,0.03)!important}
        .sess-row:hover .del{opacity:1!important}
        .tool-btn:hover:not(:disabled){background:#f9fafb!important;border-color:#d1d5db!important;box-shadow:0 2px 6px rgba(0,0,0,0.03)!important;transform:translateY(-1px)}
        .send:hover:not(:disabled){background:#000!important;color:#fff!important}
        .chip:hover{background:#f3f4f6!important;border-color:#d1d5db!important;color:#111827!important}
        .upload-zone:hover{border-color:#9ca3af!important;background:#f9fafb!important}
        .action-btn:hover{background:rgba(0,0,0,0.05)!important;color:#111827!important}
        textarea{resize:none;scrollbar-width:none}
        textarea::-webkit-scrollbar{display:none}
        input[type=checkbox]{accent-color:#000;width:14px;height:14px;cursor:pointer;flex-shrink:0}
      \\\`}</style>\`);

// 4. Topbar Scholarly -> SmartAI
code = code.replace(/background: '#fff', color: '#000'/g, "background: '#111827', color: '#fff'");
code = code.replace(/Scholarly/g, "SmartAI");
code = code.replace(/background: T.text, border: 'none'/g, "background: '#111827', border: 'none'");
code = code.replace(/color: T.bg, cursor: 'pointer'/g, "color: '#fff', cursor: 'pointer'");

// 5. Left Sidebar Checkbox/Icons
code = code.replace(/background: src.selected \\? 'rgba\\(99,102,241,0.2\\)' : 'rgba\\(255,255,255,0.04\\)'/g, "background: src.selected ? 'rgba(59,130,246,0.1)' : '#f3f4f6'");
code = code.replace(/color: T.accentL, cursor: 'pointer'/g, "color: '#2563eb', cursor: 'pointer'");
code = code.replace(/boxShadow: \\\`0 0 5px \\\\$\\{T.accent\\}\\\`/g, "/* boxshadow */");

// 6. Messages Empty State
code = code.replace(/background: T.surfaceHigh, border: \\\`1px solid \\\\$\\{T.borderM\\}\\\`/g, "background: '#ffffff', border: \`1px solid \${T.border}\`");
code = code.replace(/boxShadow: '0 8px 32px rgba\\(0,0,0,0.2\\)'/g, "boxShadow: '0 4px 12px rgba(0,0,0,0.05)'");
code = code.replace(/boxShadow: '0 2px 8px rgba\\(0,0,0,0.05\\)'/g, "boxShadow: '0 1px 3px rgba(0,0,0,0.02)'");

// 7. Messages
code = code.replace(/background: '#27272a', color: '#fafafa'/g, "background: '#f3f4f6', color: '#111827'");
code = code.replace(/border: \\\`1px solid #3f3f46\\\`/g, "border: \`1px solid #e5e7eb\`");

// 8. Input Area
code = code.replace(/background: '#1c1e23'/g, "background: '#ffffff'");
code = code.replace(/boxShadow: '0 4px 20px rgba\\(0,0,0,0.15\\)'/g, "boxShadow: '0 4px 12px rgba(0,0,0,0.05)'");
code = code.replace(/color: '#f8fafc'/g, "color: '#111827'");
code = code.replace(/background: input.trim\\(\\) && \\(chatMode === 'general' \\|\\| ragReady\\) \\? '#4b5563' : 'rgba\\(255,255,255,0.08\\)'/g, "background: input.trim() && (chatMode === 'general' || ragReady) ? '#111827' : '#f3f4f6'");
code = code.replace(/color: '#fff'/g, "color: input.trim() && (chatMode === 'general' || ragReady) ? '#fff' : '#9ca3af'");

// 9. Dropdown Button
code = code.replace(/background: 'transparent', color: T.textSub, display: 'flex'/g, "background: '#f9fafb', border: \`1px solid \${T.border}\`, color: T.textSub, display: 'flex'");
code = code.replace(/chatMode === 'general' \\? 'rgba\\(255,255,255,0.08\\)' : 'transparent'/g, "chatMode === 'general' ? '#f3f4f6' : 'transparent'");
code = code.replace(/chatMode === 'rag' \\? 'rgba\\(255,255,255,0.08\\)' : 'transparent'/g, "chatMode === 'rag' ? '#f3f4f6' : 'transparent'");

// 10. Tools (Quiz/Summary) Sidebar
const toolsRegex = /<div style=\\{\\{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' \\}\\}>[\\s\\S]*?\\)\\n            \\)}/m;
const newTools = \`<div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
                  {[
                    { tool: 'summary' as const, icon: '📝', label: 'Summary', desc: 'Key concepts & structured overview' },
                    { tool: 'quiz' as const, icon: '🎯', label: 'Quiz', desc: '5 MCQs + 3 short answer questions' },
                  ].map(({ tool, icon, label, desc }) => (
                    <div key={tool} style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: \\\`1px solid \\\${T.border}\\\`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>{icon}</div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text }}>{label}</div>
                          <div style={{ fontSize: '0.7rem', color: T.textMuted, marginTop: 1 }}>{desc}</div>
                        </div>
                      </div>
                      {sources.length === 0
                        ? <div style={{ padding: '16px', background: '#f9fafb', border: \\\`1px dashed \\\${T.borderM}\\\`, borderRadius: 10, textAlign: 'center', fontSize: '0.75rem', color: T.textMuted }}>Upload a document to use this tool</div>
                        : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {sources.map(src => (
                              <button key={src.id} className="tool-btn" onClick={() => runTool(tool, src.id)} disabled={toolLoading}
                                style={{ width: '100%', background: '#ffffff', border: \\\`1px solid \\\${T.border}\\\`, borderRadius: 10, padding: '12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f8fafc', border: \\\`1px solid \\\${T.border}\\\`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0, color: '#3b82f6' }}>📄</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.8rem', color: T.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{src.name.replace(/\\.[^.]+$/, '')}</div>
                                  <div style={{ fontSize: '0.68rem', color: T.textMuted, marginTop: 3 }}>{src.size}</div>
                                </div>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, fontSize: '0.75rem', flexShrink: 0 }}>→</div>
                              </button>
                            ))}
                          </div>
                      }
                    </div>
                  ))}
                </div>
              )
            }\`;
code = code.replace(toolsRegex, newTools);

fs.writeFileSync('c:\\\\Users\\\\rabie\\\\Desktop\\\\ai-tutor\\\\app\\\\page.tsx', code);
console.log("Done");
