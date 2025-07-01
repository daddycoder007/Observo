import fs from 'fs';
import path from 'path';

export const watchLogFile = (file, onLine) => {
  if (!fs.existsSync(file.path)) {
    console.error(`❌ File does not exist: ${file.path}`);
    return;
  }

  console.log(`🔍 Starting to watch: ${file.path} with tag: ${file.tag}`);

  // Read existing content first
  // try {
  //   const existingContent = fs.readFileSync(file.path, 'utf8');
  //   const lines = existingContent.split('\n').filter(line => line.trim() !== '');
    
  //   console.log(`📖 Found ${lines.length} existing lines in ${file.path}`);
    
  //   lines.forEach(line => {
  //     console.log(`📝 Processing existing line: ${line}`);
  //     onLine({
  //       line,
  //       tag: file.tag,
  //       path: file.path,
  //     });
  //   });
  // } catch (error) {
  //   console.error(`❌ Error reading existing content from ${file.path}:`, error);
  // }

  // Watch for new content
  let lastSize = fs.statSync(file.path).size;
  
  const watcher = fs.watch(file.path, (eventType, filename) => {
    if (eventType === 'change') {
      try {
        const currentSize = fs.statSync(file.path).size;
        
        if (currentSize > lastSize) {
          // Read only the new content
          const stream = fs.createReadStream(file.path, {
            start: lastSize,
            end: currentSize - 1
          });
          
          let buffer = '';
          stream.on('data', (chunk) => {
            buffer += chunk.toString();
          });
          
          stream.on('end', () => {
            const newLines = buffer.split('\n').filter(line => line.trim() !== '');
            newLines.forEach(line => {
              console.log(`📝 New line detected: ${line}`);
              onLine({
                line,
                tag: file.tag,
                path: file.path,
              });
            });
            lastSize = currentSize;
          });
        }
      } catch (error) {
        console.error(`❌ Error reading new content from ${file.path}:`, error);
      }
    }
  });

  watcher.on('error', (error) => {
    console.error(`❌ Error watching ${file.path}:`, error);
  });

  console.log(`🚀 Watching started for: ${file.path}`);
};
