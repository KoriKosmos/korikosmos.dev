import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const contentDir = path.join(process.cwd(), 'src/content/blog');

if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

rl.question('Enter blog post title: ', (title) => {
  if (!title) {
    console.error('Error: Title is required.');
    rl.close();
    process.exit(1);
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const date = new Date().toISOString().split('T')[0];
  const filename = `${slug}.md`;
  const filePath = path.join(contentDir, filename);

  if (fs.existsSync(filePath)) {
      console.error(`Error: File ${filename} already exists.`);
      process.exit(1);
  }

  const frontmatter = `---
title: "${title}"
description: "Enter description here"
pubDate: ${date}
---

Write your content here...
`;

  fs.writeFileSync(filePath, frontmatter);
  console.log(`\n✅ Created new post: src/content/blog/${filename}`);
  console.log(`Title: ${title}`);
  
  rl.close();
});
