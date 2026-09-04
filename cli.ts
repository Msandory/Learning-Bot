import readline from 'readline';

export async function waitForUserSignal(message: string = 'Press Enter to continue automation...'): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\n[WAITING] ${message}`, () => {
      rl.close();
      resolve();
    });
  });
}