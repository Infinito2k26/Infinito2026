import { randomUUID } from 'crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  EventRegistrationType,
  FeeStructure,
  RegistrationStatus,
  PaymentMode,
  PaymentStatus,
  SubOptionType,
  CustomFieldType,
  type EventSubOption,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRegistrationDto,
  SubOptionSelectionDto,
} from './dto/create-registration.dto';
import { calculateRegistrationFee } from './lib/fee-calculator.util';

type EventWithSubOptions = Prisma.EventGetPayload<{
  include: { subOptions: true };
}>;

interface CustomFieldDef {
  label: string;
  inputType: CustomFieldType;
  required: boolean;
  scope: 'TEAM' | 'PARTICIPANT';
  options?: string[];
}

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRegistrationDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { subOptions: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.isPublished || !event.registrationOpen) {
      throw new UnprocessableEntityException(
        'Registration is not open for this event',
      );
    }

    if (event.capacity != null) {
      const activeCount = await this.prisma.registration.count({
        where: {
          eventId: event.id,
          status: {
            notIn: [RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED],
          },
        },
      });

      if (activeCount >= event.capacity) {
        throw new UnprocessableEntityException('Event capacity reached');
      }
    }

    const isTeamEvent = event.registrationType === EventRegistrationType.TEAM;

    if (isTeamEvent && !dto.teamId) {
      throw new BadRequestException('teamId is required for this event');
    }
    if (!isTeamEvent && dto.teamId) {
      throw new BadRequestException(
        'teamId must not be provided for an individual event',
      );
    }

    let participantCount = 1;
    let isIITP = false;

    if (isTeamEvent) {
      const team = await this.prisma.team.findUnique({
        where: { id: dto.teamId! },
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }
      if (team.eventId !== event.id) {
        throw new BadRequestException(
          'This team was not created for this event',
        );
      }
      if (team.captainId !== userId) {
        throw new ForbiddenException(
          'Only the team captain can register this team',
        );
      }

      // Based on the captain's declared roster size (checked against
      // Event.teamSizeMin/Max at team-creation time already), not the live
      // Participant count — teammates are expected to keep joining after
      // the team registers and pays. Re-checked here as defense-in-depth in
      // case the event's team size bounds changed after the team was made.
      participantCount = team.declaredSize;
      isIITP = team.isIITP;

      if (event.teamSizeMin != null && participantCount < event.teamSizeMin) {
        throw new UnprocessableEntityException(
          `Team's declared size must be at least ${event.teamSizeMin} for this event (has ${participantCount})`,
        );
      }
      if (event.teamSizeMax != null && participantCount > event.teamSizeMax) {
        throw new UnprocessableEntityException(
          `Team's declared size exceeds the maximum of ${event.teamSizeMax} for this event (has ${participantCount})`,
        );
      }
    } else {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { isIITP: true },
      });
      isIITP = user.isIITP;
    }

    if (
      event.feeStructure === FeeStructure.GENDER_BASED &&
      !dto.genderDeclared
    ) {
      throw new UnprocessableEntityException(
        'genderDeclared is required for this event',
      );
    }

    this.validateCustomData(event.customFieldsDef, dto.customData);
    const subOptionRows = this.validateSubOptionSelections(
      event,
      dto.subOptionSelections,
    );
    this.validateAccommodation(event.hasAccommodation, dto, participantCount);

    const amount = calculateRegistrationFee({
      feeStructure: event.feeStructure,
      feeFlat: event.feeFlat != null ? Number(event.feeFlat) : null,
      feePerHead: event.feePerHead != null ? Number(event.feePerHead) : null,
      feeMale: event.feeMale != null ? Number(event.feeMale) : null,
      feeFemale: event.feeFemale != null ? Number(event.feeFemale) : null,
      participantCount,
      genderDeclared: dto.genderDeclared ?? null,
      isIITP,
      accommodationOpted: dto.accommodationOpted ?? false,
      accommodationRate:
        event.accommodationRate != null
          ? Number(event.accommodationRate)
          : null,
      accommodationDays: dto.accommodationDays ?? null,
      accommodationHeadcount: dto.accommodationHeadcount ?? null,
      messOnlyOpted: dto.messOnlyOpted ?? false,
      messOnlyRate:
        event.messOnlyRate != null ? Number(event.messOnlyRate) : null,
      messOnlyHeadcount: dto.messOnlyHeadcount ?? null,
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const registration = await tx.registration.create({
          data: {
            eventId: event.id,
            teamId: isTeamEvent ? dto.teamId : null,
            userId: isTeamEvent ? null : userId,
            isIITP,
            genderDeclared: dto.genderDeclared ?? null,
            accommodationOpted: dto.accommodationOpted ?? false,
            accommodationDays: dto.accommodationDays ?? null,
            accommodationHeadcount: dto.accommodationHeadcount ?? null,
            messOnlyOpted: dto.messOnlyOpted ?? false,
            messOnlyHeadcount: dto.messOnlyHeadcount ?? null,
            customData: dto.customData
              ? (dto.customData as Prisma.InputJsonValue)
              : undefined,
          },
        });

        if (subOptionRows.length > 0) {
          await tx.registrationSubOption.createMany({
            data: subOptionRows.map((row) => ({
              registrationId: registration.id,
              subOptionId: row.subOptionId,
              relayMembers: row.relayMembers ?? undefined,
            })),
          });
        }

        const payment = await tx.payment.create({
          data: {
            registrationId: registration.id,
            amount,
            mode: PaymentMode.MANUAL_SCREENSHOT,
            status: PaymentStatus.INITIATED,
            idempotencyKey: randomUUID(),
          },
        });

        return {
          id: registration.id,
          eventId: registration.eventId,
          status: registration.status,
          payment: {
            id: payment.id,
            amount: payment.amount,
            mode: payment.mode,
            status: payment.status,
          },
        };
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'A registration already exists for this event',
        );
      }
      throw err;
    }
  }

  private validateAccommodation(
    hasAccommodation: boolean,
    dto: CreateRegistrationDto,
    participantCount: number,
  ): void {
    const accommodationOpted = dto.accommodationOpted ?? false;
    const messOnlyOpted = dto.messOnlyOpted ?? false;

    if (!accommodationOpted && !messOnlyOpted) {
      return;
    }

    if (!hasAccommodation) {
      throw new UnprocessableEntityException(
        'This event does not offer accommodation or mess-only add-ons',
      );
    }

    if (!dto.accommodationDays) {
      throw new BadRequestException(
        'accommodationDays is required when opting into accommodation or mess-only',
      );
    }
    if (accommodationOpted && !dto.accommodationHeadcount) {
      throw new BadRequestException(
        'accommodationHeadcount is required when accommodationOpted is true',
      );
    }
    if (messOnlyOpted && !dto.messOnlyHeadcount) {
      throw new BadRequestException(
        'messOnlyHeadcount is required when messOnlyOpted is true',
      );
    }

    const totalHeadcount =
      (accommodationOpted ? (dto.accommodationHeadcount ?? 0) : 0) +
      (messOnlyOpted ? (dto.messOnlyHeadcount ?? 0) : 0);

    if (totalHeadcount > participantCount) {
      throw new UnprocessableEntityException(
        `accommodationHeadcount and messOnlyHeadcount together (${totalHeadcount}) cannot exceed the team's size (${participantCount})`,
      );
    }
  }

  private validateCustomData(
    customFieldsDef: Prisma.JsonValue,
    customData: Record<string, unknown> | undefined,
  ): void {
    const defs = (Array.isArray(customFieldsDef)
      ? customFieldsDef
      : []) as unknown as CustomFieldDef[];
    const teamFields = defs.filter((f) => f.scope === 'TEAM');

    if (teamFields.length === 0) {
      if (customData && Object.keys(customData).length > 0) {
        throw new BadRequestException(
          'This event does not accept custom registration fields',
        );
      }
      return;
    }

    const data = customData ?? {};
    const allowedLabels = new Set(teamFields.map((f) => f.label));

    for (const key of Object.keys(data)) {
      if (!allowedLabels.has(key)) {
        throw new BadRequestException(`Unknown custom field: ${key}`);
      }
    }

    for (const field of teamFields) {
      const value = data[field.label];

      if (
        field.required &&
        (value === undefined || value === null || value === '')
      ) {
        throw new BadRequestException(`Missing required field: ${field.label}`);
      }
      if (value === undefined || value === null) {
        continue;
      }

      switch (field.inputType) {
        case CustomFieldType.NUMBER:
          if (typeof value !== 'number') {
            throw new BadRequestException(`${field.label} must be a number`);
          }
          break;
        case CustomFieldType.TEXT:
        case CustomFieldType.FILE:
          if (typeof value !== 'string') {
            throw new BadRequestException(`${field.label} must be a string`);
          }
          break;
        case CustomFieldType.SELECT:
          if (
            typeof value !== 'string' ||
            (field.options && !field.options.includes(value))
          ) {
            throw new BadRequestException(
              `${field.label} must be one of the allowed options`,
            );
          }
          break;
      }
    }
  }

  private validateSubOptionSelections(
    event: EventWithSubOptions,
    selections: SubOptionSelectionDto[] | undefined,
  ): SubOptionSelectionDto[] {
    const sel = selections ?? [];

    if (sel.length === 0) {
      return [];
    }

    if (event.subOptions.length === 0) {
      throw new BadRequestException(
        'This event does not accept sub-option selections',
      );
    }

    const byId = new Map(event.subOptions.map((s) => [s.id, s]));
    const seen = new Set<string>();
    let individualCount = 0;
    let relayCount = 0;

    for (const s of sel) {
      const subOption = byId.get(s.subOptionId);

      if (!subOption || !subOption.isActive) {
        throw new BadRequestException(`Invalid sub-option: ${s.subOptionId}`);
      }
      if (seen.has(s.subOptionId)) {
        throw new BadRequestException(
          `Duplicate sub-option selection: ${s.subOptionId}`,
        );
      }
      seen.add(s.subOptionId);

      if (subOption.type === SubOptionType.RELAY) {
        if (!s.relayMembers || s.relayMembers.length === 0) {
          throw new BadRequestException(
            `relayMembers is required for relay sub-option: ${subOption.name}`,
          );
        }
        relayCount += 1;
      } else {
        individualCount += 1;
      }
    }

    // EventSubOption.maxSelectionsPerReg is stamped identically across every
    // row of a given SubOptionType (see seed.ts) and represents the total
    // number of that type selectable per registration, not a per-row repeat
    // count (you can't select "100m" three times) — so the cap is the max
    // value found among the relevant rows.
    const individualCap = this.maxSelectionsFor(
      event.subOptions,
      SubOptionType.INDIVIDUAL,
    );
    const relayCap = this.maxSelectionsFor(
      event.subOptions,
      SubOptionType.RELAY,
    );

    if (individualCap != null && individualCount > individualCap) {
      throw new UnprocessableEntityException(
        `You may select at most ${individualCap} individual events`,
      );
    }
    if (relayCap != null && relayCount > relayCap) {
      throw new UnprocessableEntityException(
        `You may select at most ${relayCap} relay events`,
      );
    }

    return sel;
  }

  private maxSelectionsFor(
    subOptions: EventSubOption[],
    type: SubOptionType,
  ): number | null {
    const rows = subOptions.filter((s) => s.type === type);
    if (rows.length === 0) {
      return null;
    }
    return Math.max(...rows.map((s) => s.maxSelectionsPerReg));
  }
}
