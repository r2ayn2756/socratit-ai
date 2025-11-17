const { execSync } = require('child_process');

try {
  console.log('Running prisma format...');
  const output = execSync('npx prisma format', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });
  console.log('SUCCESS!');
  console.log(output);
} catch (error) {
  console.log('FAILED!');
  console.log('Exit code:', error.status);
  console.log('STDOUT:', error.stdout || '(empty)');
  console.log('STDERR:', error.stderr || '(empty)');
}
