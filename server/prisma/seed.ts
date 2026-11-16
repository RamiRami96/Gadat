import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { generateRecoveryCode, hashRecoveryCode } from '../src/auth/recovery-code.js';
import { addDays, formatDate } from '../src/common/dates.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

if (existsSync('.env')) process.loadEnvFile();

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed: NODE_ENV is production.');
  process.exit(1);
}

const DEMO_USER_ID = 'demo-user';
const DAYS_OF_HISTORY = 365;

const HABITS = [
  { name: 'Read 20 pages', note: 'Before bed', days: [1, 2, 3, 4, 5, 6, 7], rate: 0.8 },
  { name: 'Drink water', note: '2 litres', days: [1, 2, 3, 4, 5, 6, 7], rate: 0.85 },
  { name: 'Stretch 10 min', note: null, days: [1, 3, 5], rate: 0.7 },
  { name: 'Meditate', note: 'Morning, 10 minutes', days: [1, 2, 3, 4, 5], rate: 0.65 },
  { name: 'Journal', note: 'Three lines is enough', days: [2, 4, 6, 7], rate: 0.6 },
];

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const random = mulberry32(2024);
    const today = formatDate(Date.now());
    const start = addDays(today, -(DAYS_OF_HISTORY - 1));
    const recoveryCode = generateRecoveryCode();

    await prisma.user.deleteMany({ where: { id: DEMO_USER_ID } });
    await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        recovery: { create: { hash: hashRecoveryCode(recoveryCode) } },
      },
    });

    let checkInCount = 0;
    for (const habit of HABITS) {
      const created = await prisma.habit.create({
        data: {
          userId: DEMO_USER_ID,
          name: habit.name,
          note: habit.note,
          days: habit.days,
          startDate: start,
        },
      });
      const rows: { habitId: string; date: string }[] = [];
      for (let i = 0; i < DAYS_OF_HISTORY; i += 1) {
        const date = addDays(start, i);
        if (date === today) continue;
        if (habit.days.includes(isoWeekday(date)) && random() < habit.rate) {
          rows.push({ habitId: created.id, date });
        }
      }
      await prisma.checkIn.createMany({ data: rows, skipDuplicates: true });
      checkInCount += rows.length;
    }

    console.log(`Seeded demo user with ${HABITS.length} habits and ${checkInCount} check-ins.`);
    console.log(`Sign in with this recovery code: ${recoveryCode}`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
