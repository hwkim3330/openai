import readline from 'node:readline';

export const runCli = async (runtime) => {
  console.log('CLI mode. Type exit to quit.');
  console.log('Commands: browse:, stock:, weather:, traffic:');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'you> '
  });

  rl.prompt();
  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (['exit', 'quit'].includes(input.toLowerCase())) {
      rl.close();
      process.exit(0);
    }

    const output = await runtime.handle(input);
    console.log(`ai> ${output}`);
    rl.prompt();
  });
};
