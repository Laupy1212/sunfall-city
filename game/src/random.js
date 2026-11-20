// Seeded Random Number Generator for Sunfall City

export class Random {
  constructor(seed = 1) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }

  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  choice(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  chance(probability = 0.5) {
    return this.next() < probability;
  }
}

let globalRng = new Random(1);

export function setSeed(seed) {
  globalRng = new Random(seed);
}

export function rngNext() {
  return globalRng.next();
}

export function rngRange(min, max) {
  return globalRng.range(min, max);
}

export function rngInt(min, max) {
  return globalRng.int(min, max);
}

export function rngChoice(arr) {
  return globalRng.choice(arr);
}
