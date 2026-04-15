import { exec } from 'child_process';
exec('netstat -tulpn | grep node', (err, stdout, stderr) => {
  console.log(stdout);
});
