
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  
  import {
    ReservationSource,
    ReservationStatus,
  } from "../../generated/prisma/enums.js";
  
  import { PrismaService } from "../../database/prisma.service.js";
  
  import { PricingCalculatorService } from "../pricing/pricing-calculator.service.js";
  
  import { ReservationNumberService } from "./reservation-number.service.js";
  import { NotificationQueueService } from "../../queues/notification-queue.service.js";
  
  import { CreateReservationDto } from "./dto/create-reservation.dto.js";
  import { UpdateReservationDto } from "./dto/update-reservation.dto.js";
  import { SearchReservationsDto } from "./dto/search-reservations.dto.js";
  
  // ============================================
  // RESERVATION SERVICE
  // ============================================
  
  @Injectable()
  export class ReservationsService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly pricingCalculator: PricingCalculatorService,
      private readonly reservationNumber: ReservationNumberService,
      private readonly notificationQueue: NotificationQueueService,
    ) {}

    private async notifyReservationConfirmed(reservation: {
      tenantId: string;
      id: string;
      confirmationCode: string;
    }) {
      await this.notificationQueue.enqueueReservationConfirmed({
        tenantId: reservation.tenantId,
        reservationId: reservation.id,
        confirmationCode: reservation.confirmationCode,
      });
    }
  
    // ==========================================
    // DATE HELPERS
    // ==========================================
  
    private parseDate(value: string): Date {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new BadRequestException(
          "Dates must use YYYY-MM-DD format.",
        );
      }
  
      const date = new Date(`${value}T00:00:00.000Z`);
  
      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        throw new BadRequestException("Invalid reservation date.");
      }
  
      return date;
    }
  
    private getDateRange(checkIn: Date, checkOut: Date): Date[] {
      const dates: Date[] = [];
  
      const current = new Date(checkIn);
  
      while (current < checkOut) {
        dates.push(new Date(current));
  
        current.setUTCDate(current.getUTCDate() + 1);
      }
  
      return dates;
    }
  
    private getNumberOfNights(
      checkIn: Date,
      checkOut: Date,
    ): number {
      return Math.round(
        (checkOut.getTime() - checkIn.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }
  
    private toMoney(value: number): string {
      return (Math.round((value + Number.EPSILON) * 100) / 100)
        .toFixed(2);
    }
  
    // ==========================================
    // CREATE RESERVATION
    // ==========================================
  
    async create(
      tenantId: string,
      branchId: string,
      dto: CreateReservationDto,
    ) {
      const checkIn = this.parseDate(dto.checkIn);
      const checkOut = this.parseDate(dto.checkOut);
  
      if (checkOut <= checkIn) {
        throw new BadRequestException(
          "Check-out date must be after check-in date.",
        );
      }
  
      if (dto.rooms.length === 0) {
        throw new BadRequestException(
          "At least one room must be selected.",
        );
      }
  
      const numberOfNights = this.getNumberOfNights(
        checkIn,
        checkOut,
      );
  
      // ----------------------------------------
      // 1. Validate branch
      // ----------------------------------------
  
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: branchId,
          tenantId,
        },
        select: {
          id: true,
          hotelId: true,
        },
      });
  
      if (!branch) {
        throw new NotFoundException("Branch not found.");
      }
  
      // ----------------------------------------
      // 2. Calculate pricing for each room
      // ----------------------------------------
  
      const pricingResults = [];
  
      let totalAmount = 0;
  
      for (const requestedRoom of dto.rooms) {
        const pricing = await this.pricingCalculator.calculate({
          tenantId,
          ratePlanId: requestedRoom.ratePlanId,
          checkIn: dto.checkIn,
          checkOut: dto.checkOut,
        });
  
        if (pricing.roomTypeId !== requestedRoom.roomTypeId) {
          throw new BadRequestException(
            "The selected rate plan does not belong to the selected room type.",
          );
        }
  
        if (pricing.total <= 0) {
          throw new BadRequestException(
            "The calculated room price must be greater than zero.",
          );
        }
  
        pricingResults.push({
          requestedRoom,
          pricing,
        });
  
        totalAmount += pricing.total;
      }
  
      const currencies = [
        ...new Set(pricingResults.map((item) => item.pricing.currency)),
      ];
  
      if (currencies.length !== 1) {
        throw new BadRequestException(
          "All rooms in a reservation must use the same currency.",
        );
      }
  
      const currency = currencies[0];
  
      // ----------------------------------------
      // 3. Group rooms by room type
      // ----------------------------------------
  
      const roomCounts = new Map<string, number>();
  
      for (const room of dto.rooms) {
        roomCounts.set(
          room.roomTypeId,
          (roomCounts.get(room.roomTypeId) ?? 0) + 1,
        );
      }
  
      const reservationRooms = pricingResults.map((item) => ({
        tenantId,
        roomTypeId: item.requestedRoom.roomTypeId,
        roomId: item.requestedRoom.roomId ?? null,
        ratePlanId: item.requestedRoom.ratePlanId,
        nightlyRate: this.toMoney(
          item.pricing.subtotal / numberOfNights,
        ),
      }));
  
      // ----------------------------------------
      // 4. Transaction
      // ----------------------------------------
  
      try {
        const result = await this.prisma.$transaction(
          async (tx) => {
            // Validate physical room assignments.
  
            const assignedRoomIds = dto.rooms
              .map((room) => room.roomId)
              .filter((id): id is string => Boolean(id));
  
            if (
              new Set(assignedRoomIds).size !== assignedRoomIds.length
            ) {
              throw new BadRequestException(
                "The same physical room cannot be selected more than once.",
              );
            }
  
            for (const requestedRoom of dto.rooms) {
              if (!requestedRoom.roomId) {
                continue;
              }
  
              const physicalRoom = await tx.room.findFirst({
                where: {
                  id: requestedRoom.roomId,
                  tenantId,
                  branchId,
                  roomTypeId: requestedRoom.roomTypeId,
                  status: "AVAILABLE",
                },
              });
  
              if (!physicalRoom) {
                throw new ConflictException(
                  "A selected physical room is unavailable or does not belong to this branch and room type.",
                );
              }
  
              const overlappingReservation =
                await tx.reservationRoom.findFirst({
                  where: {
                    tenantId,
                    roomId: requestedRoom.roomId,
                    reservation: {
                      is: {
                        status: {
                          in: [
                            ReservationStatus.PENDING,
                            ReservationStatus.CONFIRMED,
                            ReservationStatus.CHECKED_IN,
                          ],
                        },
                        checkIn: {
                          lt: checkOut,
                        },
                        checkOut: {
                          gt: checkIn,
                        },
                      },
                    },
                  },
                });
  
              if (overlappingReservation) {
                throw new ConflictException(
                  "A selected physical room is already reserved for these dates.",
                );
              }
  
              const overlappingBlock = await tx.roomBlock.findFirst({
                where: {
                  tenantId,
                  roomId: requestedRoom.roomId,
                  status: "ACTIVE",
                  startDate: {
                    lt: checkOut,
                  },
                  endDate: {
                    gt: checkIn,
                  },
                },
              });
  
              if (overlappingBlock) {
                throw new ConflictException(
                  "A selected physical room is blocked for these dates.",
                );
              }
            }
  
            // ----------------------------------
            // 5. Reserve daily inventory
            // ----------------------------------
  
            const dates = this.getDateRange(checkIn, checkOut);
  
            for (const [roomTypeId, requestedCount] of roomCounts) {
              for (const date of dates) {
                const inventory = await tx.roomInventory.findUnique({
                  where: {
                    branchId_roomTypeId_date: {
                      branchId,
                      roomTypeId,
                      date,
                    },
                  },
                });
  
                if (!inventory || inventory.tenantId !== tenantId) {
                  throw new ConflictException(
                    `Room inventory is not configured for ${date.toISOString().slice(0, 10)}.`,
                  );
                }
  
                const availableRooms =
                  inventory.totalRooms -
                  inventory.reservedRooms -
                  inventory.blockedRooms;
  
                if (availableRooms < requestedCount) {
                  throw new ConflictException(
                    `Not enough rooms available for ${date.toISOString().slice(0, 10)}.`,
                  );
                }
  
                await tx.roomInventory.update({
                  where: {
                    id: inventory.id,
                  },
                  data: {
                    reservedRooms: {
                      increment: requestedCount,
                    },
                  },
                });
              }
            }
  
            // ----------------------------------
            // 6. Create or reuse guest
            // ----------------------------------
  
            let guest = null;
  
            if (dto.guest.email) {
              guest = await tx.guest.findFirst({
                where: {
                  tenantId,
                  email: {
                    equals: dto.guest.email,
                    mode: "insensitive",
                  },
                },
              });
            }
  
            if (!guest && dto.guest.phone) {
              guest = await tx.guest.findFirst({
                where: {
                  tenantId,
                  phone: dto.guest.phone,
                },
              });
            }
  
            if (!guest) {
              guest = await tx.guest.create({
                data: {
                  tenantId,
                  firstName: dto.guest.firstName,
                  lastName: dto.guest.lastName,
                  email: dto.guest.email,
                  phone: dto.guest.phone,
                  address: dto.guest.address,
                  country: dto.guest.country,
                  notes: dto.guest.notes,
                },
              });
            }
  
            // ----------------------------------
            // 7. Generate confirmation code
            // ----------------------------------
  
            const confirmationCode = this.reservationNumber.generate();

            const source = dto.source ?? ReservationSource.ADMIN;
            const initialStatus =
              source === ReservationSource.ADMIN &&
              dto.confirmOnCreate !== false
                ? ReservationStatus.CONFIRMED
                : ReservationStatus.PENDING;
  
            // ----------------------------------
            // 8. Create reservation
            // ----------------------------------
  
            const reservation = await tx.reservation.create({
              data: {
                tenantId,
                hotelId: branch.hotelId,
                branchId,
                guestId: guest.id,
                confirmationCode,
                checkIn,
                checkOut,
                adults: dto.adults,
                children: dto.children,
                source,
                status: initialStatus,
                currency,
                totalAmount: this.toMoney(totalAmount),
                specialRequests: dto.specialRequests,
                rooms: {
                  create: reservationRooms,
                },
              },
              include: {
                guest: true,
                rooms: {
                  include: {
                    roomType: true,
                    room: true,
                    ratePlan: true,
                  },
                },
              },
            });
  
            return reservation;
          },
          {
            isolationLevel: "Serializable",
          },
        );

        if (result.status === ReservationStatus.CONFIRMED) {
          await this.notifyReservationConfirmed(result);
        }

        return result;
      } catch (error) {
        if (
          error instanceof BadRequestException ||
          error instanceof NotFoundException ||
          error instanceof ConflictException
        ) {
          throw error;
        }
  
        // PostgreSQL serialization conflict / Prisma transaction conflict.
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2034"
        ) {
          throw new ConflictException(
            "Inventory changed while creating the reservation. Please try again.",
          );
        }
  
        throw error;
      }
    }
  
    // ==========================================
    // FIND ALL RESERVATIONS
    // ==========================================
  
    async findAll(
      tenantId: string,
      branchId: string,
      filters: SearchReservationsDto,
    ) {
      const where: any = {
        tenantId,
        branchId,
      };
  
      if (filters.confirmationCode) {
        where.confirmationCode = {
          contains: filters.confirmationCode,
          mode: "insensitive",
        };
      }
  
      if (filters.status) {
        where.status = filters.status;
      }
  
      if (filters.checkInFrom || filters.checkInTo) {
        where.checkIn = {};
  
        if (filters.checkInFrom) {
          where.checkIn.gte = this.parseDate(filters.checkInFrom);
        }
  
        if (filters.checkInTo) {
          where.checkIn.lte = this.parseDate(filters.checkInTo);
        }
      }
  
      if (filters.checkOutFrom || filters.checkOutTo) {
        where.checkOut = {};
  
        if (filters.checkOutFrom) {
          where.checkOut.gte = this.parseDate(filters.checkOutFrom);
        }
  
        if (filters.checkOutTo) {
          where.checkOut.lte = this.parseDate(filters.checkOutTo);
        }
      }
  
      if (filters.guestEmail) {
        where.guest = {
          is: {
            email: {
              contains: filters.guestEmail,
              mode: "insensitive",
            },
          },
        };
      }
  
      if (filters.guestPhone) {
        where.guest = {
          is: {
            phone: {
              contains: filters.guestPhone,
            },
          },
        };
      }
  
      if (filters.guestName) {
        where.guest = {
          is: {
            OR: [
              {
                firstName: {
                  contains: filters.guestName,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: filters.guestName,
                  mode: "insensitive",
                },
              },
            ],
          },
        };
      }
  
      if (filters.roomTypeId) {
        where.rooms = {
          some: {
            roomTypeId: filters.roomTypeId,
          },
        };
      }
  
      return this.prisma.reservation.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          guest: true,
          rooms: {
            include: {
              roomType: true,
              room: true,
              ratePlan: true,
            },
          },
          payments: true,
        },
      });
    }
  
    // ==========================================
    // FIND ONE RESERVATION
    // ==========================================
  
    async findOne(tenantId: string, reservationId: string) {
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          id: reservationId,
          tenantId,
        },
        include: {
          guest: true,
          hotel: true,
          branch: true,
          rooms: {
            include: {
              roomType: true,
              room: true,
              ratePlan: true,
            },
          },
          payments: true,
        },
      });
  
      if (!reservation) {
        throw new NotFoundException("Reservation not found.");
      }
  
      return reservation;
    }
  
    // ==========================================
    // UPDATE RESERVATION
    // ==========================================
  
    async update(
      tenantId: string,
      reservationId: string,
      dto: UpdateReservationDto,
    ) {
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          id: reservationId,
          tenantId,
        },
      });
  
      if (!reservation) {
        throw new NotFoundException("Reservation not found.");
      }
  
      if (
        reservation.status !== ReservationStatus.PENDING &&
        reservation.status !== ReservationStatus.CONFIRMED
      ) {
        throw new BadRequestException(
          "Only pending or confirmed reservations can be updated.",
        );
      }
  
      return this.prisma.reservation.update({
        where: {
          id: reservationId,
        },
        data: {
          adults: dto.adults,
          children: dto.children,
          specialRequests: dto.specialRequests,
        },
        include: {
          guest: true,
          rooms: {
            include: {
              roomType: true,
              room: true,
              ratePlan: true,
            },
          },
        },
      });
    }
  
    // ==========================================
    // CONFIRM RESERVATION
    // ==========================================
  
    async confirm(tenantId: string, reservationId: string) {
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          id: reservationId,
          tenantId,
        },
      });
  
      if (!reservation) {
        throw new NotFoundException("Reservation not found.");
      }
  
      if (reservation.status !== ReservationStatus.PENDING) {
        throw new BadRequestException(
          "Only pending reservations can be confirmed.",
        );
      }
  
      const updated = await this.prisma.reservation.update({
        where: {
          id: reservationId,
        },
        data: {
          status: ReservationStatus.CONFIRMED,
        },
        include: {
          guest: true,
          rooms: true,
        },
      });

      await this.notifyReservationConfirmed(updated);

      return updated;
    }



  // ==========================================
  // CHECK IN
  // ==========================================

  async checkIn(tenantId: string, reservationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: {
          id: reservationId,
          tenantId,
        },
      });

      if (!reservation) {
        throw new NotFoundException("Reservation not found.");
      }

      if (reservation.status !== ReservationStatus.CONFIRMED) {
        throw new BadRequestException(
          "Only confirmed reservations can be checked in.",
        );
      }

      return tx.reservation.update({
        where: {
          id: reservationId,
        },
        data: {
          status: ReservationStatus.CHECKED_IN,
        },
        include: {
          guest: true,
          rooms: {
            include: {
              roomType: true,
              room: true,
            },
          },
        },
      });
    });
  }

  // ==========================================
  // CHECK OUT
  // ==========================================

  async checkOut(tenantId: string, reservationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findFirst({
        where: {
          id: reservationId,
          tenantId,
        },
      });

      if (!reservation) {
        throw new NotFoundException("Reservation not found.");
      }

      if (reservation.status !== ReservationStatus.CHECKED_IN) {
        throw new BadRequestException(
          "Only checked-in reservations can be checked out.",
        );
      }

      return tx.reservation.update({
        where: {
          id: reservationId,
        },
        data: {
          status: ReservationStatus.CHECKED_OUT,
        },
        include: {
          guest: true,
          rooms: {
            include: {
              roomType: true,
              room: true,
            },
          },
        },
      });
    });
  }

  // ==========================================
  // MARK RESERVATION AS NO-SHOW
  // ==========================================

  async markNoShow(tenantId: string, reservationId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const reservation = await tx.reservation.findFirst({
          where: {
            id: reservationId,
            tenantId,
          },
          include: {
            rooms: true,
          },
        });

        if (!reservation) {
          throw new NotFoundException("Reservation not found.");
        }

        if (
          reservation.status !== ReservationStatus.PENDING &&
          reservation.status !== ReservationStatus.CONFIRMED
        ) {
          throw new BadRequestException(
            "Only pending or confirmed reservations can be marked as no-show.",
          );
        }

        const roomCounts = new Map<string, number>();

        for (const room of reservation.rooms) {
          roomCounts.set(
            room.roomTypeId,
            (roomCounts.get(room.roomTypeId) ?? 0) + 1,
          );
        }

        const dates = this.getDateRange(
          reservation.checkIn,
          reservation.checkOut,
        );

        // Release reserved inventory for every booked room and night.
        for (const [roomTypeId, count] of roomCounts) {
          for (const date of dates) {
            const inventory = await tx.roomInventory.findUnique({
              where: {
                branchId_roomTypeId_date: {
                  branchId: reservation.branchId,
                  roomTypeId,
                  date,
                },
              },
            });

            if (!inventory || inventory.tenantId !== tenantId) {
              throw new ConflictException(
                "Reservation inventory could not be found. No-show processing was not completed.",
              );
            }

            if (inventory.reservedRooms < count) {
              throw new ConflictException(
                "Inventory reservation count is inconsistent. No-show processing was not completed.",
              );
            }

            await tx.roomInventory.update({
              where: {
                id: inventory.id,
              },
              data: {
                reservedRooms: {
                  decrement: count,
                },
              },
            });
          }
        }

        return tx.reservation.update({
          where: {
            id: reservationId,
          },
          data: {
            status: ReservationStatus.NO_SHOW,
          },
          include: {
            guest: true,
            rooms: true,
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );
  }

  
    // ==========================================
    // CANCEL RESERVATION
    // ==========================================
  
    async cancel(
      tenantId: string,
      reservationId: string,
    ) {
      return this.prisma.$transaction(
        async (tx) => {
          const reservation = await tx.reservation.findFirst({
            where: {
              id: reservationId,
              tenantId,
            },
            include: {
              rooms: true,
            },
          });
  
          if (!reservation) {
            throw new NotFoundException("Reservation not found.");
          }
  
          if (
            reservation.status !== ReservationStatus.PENDING &&
            reservation.status !== ReservationStatus.CONFIRMED
          ) {
            throw new BadRequestException(
              "Only pending or confirmed reservations can be cancelled.",
            );
          }
  
          const roomCounts = new Map<string, number>();
  
          for (const room of reservation.rooms) {
            roomCounts.set(
              room.roomTypeId,
              (roomCounts.get(room.roomTypeId) ?? 0) + 1,
            );
          }
  
          const dates = this.getDateRange(
            reservation.checkIn,
            reservation.checkOut,
          );
  
          for (const [roomTypeId, count] of roomCounts) {
            for (const date of dates) {
              const inventory = await tx.roomInventory.findUnique({
                where: {
                  branchId_roomTypeId_date: {
                    branchId: reservation.branchId,
                    roomTypeId,
                    date,
                  },
                },
              });
  
              if (!inventory || inventory.tenantId !== tenantId) {
                throw new ConflictException(
                  "Reservation inventory could not be found. Cancellation was not completed.",
                );
              }
  
              if (inventory.reservedRooms < count) {
                throw new ConflictException(
                  "Inventory reservation count is inconsistent. Cancellation was not completed.",
                );
              }
  
              await tx.roomInventory.update({
                where: {
                  id: inventory.id,
                },
                data: {
                  reservedRooms: {
                    decrement: count,
                  },
                },
              });
            }
          }
  
          return tx.reservation.update({
            where: {
              id: reservationId,
            },
            data: {
              status: ReservationStatus.CANCELLED,
            },
            include: {
              guest: true,
              rooms: true,
            },
          });
        },
        {
          isolationLevel: "Serializable",
        },
      );
    }
  }
  