// Build step: copies vendor libraries and generates the SVG icon sprite (js/icons.js).
// Run with: npm run build
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const lucideDir = path.join(root, 'node_modules', 'lucide-static', 'icons');

// 1. Vendor: GSAP
fs.mkdirSync(path.join(root, 'js', 'vendor'), { recursive: true });
fs.copyFileSync(
  path.join(root, 'node_modules', 'gsap', 'dist', 'gsap.min.js'),
  path.join(root, 'js', 'vendor', 'gsap.min.js')
);

// 2. Lucide icons (stroke icons, ISC license)
const lucide = [
  'feather', 'book-open', 'crown', 'axe', 'flame', 'sailboat', 'messages-square', 'tree-palm',
  'castle', 'scale', 'drama', 'sun', 'map', 'thumbs-up', 'thumbs-down', 'lock-open', 'lock',
  'hourglass', 'house', 'library', 'package-open', 'hospital', 'gem', 'brain', 'cog', 'gavel',
  'landmark', 'footprints', 'puzzle', 'calendar-days', 'link', 'graduation-cap', 'pill', 'cctv',
  'factory', 'telescope', 'swords', 'shield', 'lightbulb', 'users', 'shirt', 'ship',
  'tower-control', 'hand-coins', 'coins', 'sparkles', 'eye', 'compass', 'scroll-text',
  'crosshair', 'heart-pulse', 'wheat', 'church', 'check', 'route', 'building-2', 'ban', 'skull'
];

let symbols = '';
for (const name of lucide) {
  const svg = fs.readFileSync(path.join(lucideDir, name + '.svg'), 'utf8');
  const inner = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
  symbols += `<symbol id="i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>`;
}

// 3. Custom icons (drawn for this project, same 24x24 stroke grammar)
const custom = {
  sheep: '<path d="M7 10a3 3 0 0 1 4-3 3 3 0 0 1 5 1 3 3 0 0 1 2 5 3 3 0 0 1-3 3H9a3 3 0 0 1-3-3 3 3 0 0 1 1-3z"/><path d="M18 10.5c1.5-.5 3 .2 3 1.6S19.8 14 18.5 13.5"/><path d="M9 16v3M12 16v3M15 16v3"/><circle cx="20" cy="11.6" r=".4"/>',
  noose: '<path d="M4 2h16"/><path d="M12 2v4"/><rect x="10" y="6" width="4" height="6" rx="1"/><path d="M10 8h4M10 10h4"/><path d="M10.5 12C7 13 6 15.5 6 17.5a6 6 0 0 0 12 0c0-2-1-4.5-4.5-5.5"/>',
  jester: '<path d="M4 15c0-5 3-9 8-10 5 1 8 5 8 10"/><path d="M4 15 7 7l3 6 2-8 2 8 3-6 3 8"/><path d="M4 15h16v3H4z"/><circle cx="7" cy="6" r="1.2"/><circle cx="12" cy="4" r="1.2"/><circle cx="17" cy="6" r="1.2"/>',
  monk: '<circle cx="12" cy="8" r="4"/><path d="M8.5 6.5h7"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/><path d="M12 14v7M10 17h4"/>',
  cage: '<path d="M6 20V10a6 6 0 0 1 12 0v10"/><path d="M4 20h16"/><path d="M9 20V6.5M12 20V4M15 20V6.5"/><path d="M6 13h12"/><circle cx="12" cy="2.6" r="1"/>',
  venus: '<circle cx="12" cy="9" r="5"/><path d="M12 14v8M9 19h6"/>',
  mirror: '<rect x="6" y="2.5" width="12" height="17" rx="6"/><path d="M9 10l4-4M9 14l6-6"/><path d="M12 19.5V22M9 22h6"/>',
  rope: '<path d="M3 12c3-4 6 4 9 0s6 4 9 0"/><path d="M3 8c3-4 6 4 9 0s6 4 9 0" opacity=".5"/><path d="M3 16c3-4 6 4 9 0s6 4 9 0" opacity=".5"/>',
  thief: '<circle cx="9" cy="5" r="2.5"/><path d="M9 8l-2 6 4 2 1 6M7 14l-3 3M10 10l4 2"/><path d="M14 9c3-2 7 0 7 3s-3 5-6 4c-2-1-3-4-1-7z"/>',
  chalice: '<path d="M7 4h10c0 6-2 9-5 9s-5-3-5-9z"/><path d="M12 13v5M8 21h8M9 18h6"/><path d="M17 6c2 0 3 1 3 2.5S18.5 11 16.5 11"/>',
  wool: '<circle cx="11" cy="13" r="7"/><path d="M5 11c4 0 8 2 11 7M6 16c3-2 7-2 11-1M9 6.5c2 2 3 6 2 12"/><path d="M16 7l5-5M18 9l4-4"/>',
  peasant: '<circle cx="10" cy="5" r="2"/><path d="M6 4h8"/><path d="M10 7v7l-2 7M10 14l2 7M10 9l-3 3M10 9l5 1"/><path d="M17 2v20M15.5 2v2.5h3V2"/>',
  bridge: '<path d="M2 18h20"/><path d="M3 18v-3a9 9 0 0 1 18 0v3"/><path d="M8 18v-3a4 4 0 0 1 8 0v3"/><path d="M2 11h20" opacity=".5"/>',
  diamond: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M12 21 8 9l4-6 4 6z"/>',
  necklace: '<path d="M4 3c0 6 3.5 9 8 9s8-3 8-9"/><path d="M12 12l3 4-3 5-3-5z"/><circle cx="6.5" cy="8" r=".6"/><circle cx="17.5" cy="8" r=".6"/>',
  divergent: '<path d="M12 22v-8"/><path d="M12 14 5 6M12 14l7-8"/><path d="M5 10V6h4M19 10V6h-4"/>',
  island: '<path d="M2 18c3-1 6-1 10 0s7 1 10 0"/><path d="M4 16c2-4 5-6 8-6s6 2 8 6"/><path d="M12 10V4M12 4c-2-1-4 0-5 1M12 4c2-1 4 0 5 1M12 4c-1 1-1.5 2.5-1 4"/>',
  candle: '<path d="M9 10h6v11H9z"/><path d="M12 10V8"/><path d="M12 2c1.5 2 2 3 0 5-2-2-1.5-3 0-5z"/><path d="M6 21h12"/>',
  ring: '<circle cx="12" cy="15" r="6"/><path d="M9 6h6l-1.5-3h-3z"/><path d="M9 6l3 3 3-3"/>',
  handcuffs: '<circle cx="7" cy="15" r="4"/><circle cx="17" cy="15" r="4"/><path d="M7 11V8a2 2 0 0 1 4 0M17 11V8a2 2 0 0 0-4 0M11 8h2"/>',
  wanted: '<rect x="4" y="2" width="16" height="20" rx="1"/><circle cx="12" cy="11" r="3"/><path d="M8 18c1-2 2.5-3 4-3s3 1 4 3M8 5.5h8"/>',
  houses: '<path d="M2 21V13l5-4 5 4v8z"/><path d="M12 21v-6l5-4 5 4v6z"/><path d="M8 7l4-4 4 4"/><path d="M5 21v-4h4v4"/>',
  pot: '<path d="M4 8h16"/><path d="M5 8c0 7 2.5 11 7 11s7-4 7-11"/><path d="M19 10c2 0 3 1 3 2.5S20.5 15 18.5 15"/><path d="M9 19v2h6v-2"/>'
};
for (const [id, body] of Object.entries(custom)) {
  symbols += `<symbol id="i-${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`;
}

const out = `// AUTO-GENERATED by tools/build.js — do not edit by hand.
// Icons: Lucide (ISC license) + custom drawings.
(function(){
  var s = document.createElement('div');
  s.style.display = 'none';
  s.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg">${symbols.replace(/'/g, "\\'")}</svg>';
  document.body.insertBefore(s, document.body.firstChild);
})();
`;
fs.writeFileSync(path.join(root, 'js', 'icons.js'), out);
console.log('Built js/icons.js with', lucide.length + Object.keys(custom).length, 'icons; copied GSAP.');
