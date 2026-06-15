const fs = require('fs');
const path = './src/app/dashboard/page.tsx';
let txt = fs.readFileSync(path, 'utf8');

txt = txt.replace(/bg-\[#f5efe2\]/g, 'bg-surface');
txt = txt.replace(/text-slate-900/g, 'text-on-surface');
txt = txt.replace(/text-\[#2f2a22\]/g, 'text-on-surface');
txt = txt.replace(/text-\[#5e5343\]|text-\[#6f6352\]|text-\[#5f5445\]|text-\[#4d4336\]/g, 'text-on-surface/70');
txt = txt.replace(/bg-\[#fffaf2\]|bg-white|bg-\[#fffdf9\]|bg-\[#fffcf6\]|bg-\[#f7f3ea\]/g, 'bg-surface-bright');
txt = txt.replace(/border-\[#d8c6a8\]|border-\[#dfcfb5\]|border-\[#e5d8c4\]/g, 'border-none');
txt = txt.replace(/shadow-\[.*?\]/g, 'shadow-glass');
txt = txt.replace(/text-\[#0f766e\]|text-\[#115e59\]/g, 'text-primary');
txt = txt.replace(/bg-\[#0f766e\]/g, 'bg-primary-gradient');
txt = txt.replace(/bg-\[#e6fffb\]/g, 'bg-primary-container/20');
txt = txt.replace(/border-\[#0f766e\]/g, 'border-outline-variant/30');
txt = txt.replace(/bg-\[#ecfeff\]/g, 'bg-secondary-container/20');

// Additional cleanup
txt = txt.replace(/rounded-3xl border border-none bg-surface-bright p-6 shadow-glass/g, 'card-container');
txt = txt.replace(/rounded-3xl border border-none bg-surface-bright p-8 shadow-glass/g, 'card-container');
txt = txt.replace(/rounded-3xl border border-none bg-surface-bright p-4 shadow-glass/g, 'card-container');
txt = txt.replace(/rounded-2xl border border-none/g, 'glass-card');
txt = txt.replace(/text-xl font-bold/g, 'text-xl font-display font-bold text-on-surface');
txt = txt.replace(/text-3xl md:text-4xl font-black/g, 'text-3xl md:text-4xl font-display font-bold text-on-surface');
txt = txt.replace(/border-border-none/g, 'border-none');

fs.writeFileSync(path, txt);
console.log("Replacement complete");
