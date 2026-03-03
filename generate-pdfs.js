#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, 'docs');
const outputDir = path.join(__dirname, 'docs', 'pdfs');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function markdownToHtml(markdownContent, title) {
  const html = marked.parse(markdownContent);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: white; padding: 40px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #1e40af; font-size: 32px; margin: 30px 0 20px 0; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
    h2 { color: #1e40af; font-size: 24px; margin: 25px 0 15px 0; border-left: 4px solid #1e40af; padding-left: 15px; }
    h3 { color: #3b82f6; font-size: 18px; margin: 15px 0 10px 0; }
    p { margin: 10px 0; text-align: justify; }
    ul, ol { margin: 15px 0 15px 30px; }
    li { margin: 8px 0; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    table th { background: #1e40af; color: white; padding: 12px; text-align: left; font-weight: 600; }
    table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    table tr:nth-child(even) { background: #f3f4f6; }
    table tr:hover { background: #e0e7ff; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 13px; }
    pre { background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 5px; overflow-x: auto; margin: 15px 0; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; }
    pre code { background: none; padding: 0; color: #e5e7eb; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 15px; margin: 15px 0; color: #6b7280; font-style: italic; }
    strong { color: #1e40af; font-weight: 600; }
    a { color: #1e40af; text-decoration: none; border-bottom: 1px dotted #1e40af; }
    a:hover { color: #1d3557; border-bottom: 1px solid #1d3557; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 30px 0; }
    @media print { body { padding: 20px; } h1 { page-break-before: always; } a { border: none; } }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

async function main() {
  console.log('🏏 CricLive Guide Generator\n');
  console.log('📁 Output directory:', outputDir);
  console.log('');
  
  const guides = [
    { file: 'ADMINS_GUIDE.md', name: "Admin's Guide", title: 'CricLive - Admin Guide' },
    { file: 'VIEWERS_GUIDE.md', name: "Viewer's Guide", title: 'CricLive - Viewer Guide' }
  ];
  
  for (const guide of guides) {
    try {
      const mdPath = path.join(docsDir, guide.file);
      
      if (!fs.existsSync(mdPath)) {
        console.log(`❌ ${guide.name}: File not found`);
        continue;
      }
      
      console.log(`⏳ Processing ${guide.name}...`);
      const markdown = fs.readFileSync(mdPath, 'utf-8');
      const html = markdownToHtml(markdown, guide.title);
      const baseName = guide.file.replace('.md', '');
      const htmlOutputPath = path.join(outputDir, `${baseName}.html`);
      fs.writeFileSync(htmlOutputPath, html);
      console.log(`   ✅ Generated: ${baseName}.html`);
      
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n✨ Complete!');
  console.log('\n📖 Generated files:');
  console.log('   • docs/pdfs/ADMINS_GUIDE.html');
  console.log('   • docs/pdfs/VIEWERS_GUIDE.html');
  console.log('\n📝 Converting HTML to PDF:');
  console.log('   1. Open HTML file in web browser');
  console.log('   2. Press Ctrl+P (Windows/Linux) or Cmd+P (Mac)');
  console.log('   3. Choose "Save as PDF" destination');
  console.log('   4. Save the file');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
