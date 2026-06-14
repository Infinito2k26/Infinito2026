import { PrismaClient, UserRole, EventCategory, TeamMemberRole, RegistrationStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@infinito.dev',
      passwordHash,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const eventManager = await prisma.user.create({
    data: {
      email: 'eventmanager@infinito.dev',
      passwordHash,
      name: 'Event Manager',
      role: UserRole.EVENT_MANAGER,
    },
  });

  const participant1 = await prisma.user.create({
    data: {
      email: 'participant1@infinito.dev',
      passwordHash,
      name: 'Participant One',
      role: UserRole.PARTICIPANT,
    },
  });

  const participant2 = await prisma.user.create({
    data: {
      email: 'participant2@infinito.dev',
      passwordHash,
      name: 'Participant Two',
      role: UserRole.PARTICIPANT,
    },
  });

  const event1 = await prisma.event.create({
    data: {
      name: 'Code Sprint',
      slug: 'code-sprint',
      category: EventCategory.TECHNICAL,
      description: 'A competitive coding event',
      teamSizeMin: 1,
      teamSizeMax: 4,
      capacity: 100,
      price: 0,
      isPublished: true,
      registrationOpen: true,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: 'Cultural Night',
      slug: 'cultural-night',
      category: EventCategory.CULTURAL,
      description: 'An evening of performances',
      teamSizeMin: 1,
      teamSizeMax: 10,
      capacity: 500,
      price: 100,
      isPublished: true,
      registrationOpen: true,
    },
  });

  const team = await prisma.team.create({
    data: {
      name: 'The Innovators',
      captainId: participant1.id,
      collegeName: 'Infinito Institute of Technology',
      inviteCode: 'INNO-2026-01',
      members: {
        create: [
          { userId: participant1.id, role: TeamMemberRole.CAPTAIN },
          { userId: participant2.id, role: TeamMemberRole.MEMBER },
        ],
      },
    },
  });

  await prisma.registration.create({
    data: {
      eventId: event1.id,
      teamId: team.id,
      status: RegistrationStatus.PENDING_PAYMENT,
    },
  });

  console.log('Seed complete:', {
    superAdmin: superAdmin.email,
    eventManager: eventManager.email,
    participants: [participant1.email, participant2.email],
    events: [event1.slug, event2.slug],
    team: team.name,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });