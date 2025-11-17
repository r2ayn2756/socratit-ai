const { execSync } = require('child_process');

try {
  console.log('Running prisma generate...');
  const output = execSync('npx prisma generate', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('SUCCESS!');
  console.log(output);
} catch (error) {
  console.log('FAILED!');
  console.log('Exit code:', error.status);
  console.log('STDOUT:', error.stdout);
  console.log('STDERR:', error.stderr);
}
