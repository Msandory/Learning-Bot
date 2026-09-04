export const sleepWithJitter = async (baseMs: number) => {
  // Adds or subtracts up to 20% of the base time randomly
  const jitter = (Math.random() * 0.4 - 0.2) * baseMs; 
  const finalTime = baseMs + jitter;
  return new Promise(resolve => setTimeout(resolve, finalTime));
};