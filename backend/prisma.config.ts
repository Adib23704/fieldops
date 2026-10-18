import { defineConfig } from '@prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/fieldops',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
