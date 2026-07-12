const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./server');
for (let file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/from\s+['"]@db\/([^'"]+)['"]/g, (m, p1) => {
    const prefix = '../'.repeat(file.split(path.sep).length - 1);
    return `from "${prefix}db/${p1}.js"`;
  });

  content = content.replace(/from\s+['"](\.[^'"]+)['"]/g, (m, p1) => {
    if (p1.endsWith('.js') || p1.endsWith('.ts')) return m;
    return `from "${p1}.js"`;
  });
  
  content = content.replace(/import\(['"](\.[^'"]+)['"]\)/g, (m, p1) => {
    if (p1.endsWith('.js') || p1.endsWith('.ts')) return m;
    return `import("${p1}.js")`;
  });

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
