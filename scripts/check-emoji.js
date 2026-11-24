// Fails if emoji characters appear in app or server source files.
const fs = require('node:fs');
const path = require('node:path');

const emojiPattern = /(\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)/gu;
const roots = ['src', 'server'];
const textExtensions = new Set(['.js', '.jsx', '.py', '.md', '.txt', '.json', '.yml', '.yaml']);
const matches = [];

function scan(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) scan(fullPath);
    else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const match of content.matchAll(emojiPattern)) matches.push(`${fullPath}: ${match[0]}`);
    }
  }
}

for (const root of roots) if (fs.existsSync(root)) scan(root);
if (matches.length) {
  console.error(`Emoji found:\n${matches.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('No emoji found in src/ or server/.');
}
