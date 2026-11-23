export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED"
  | "NO_SHOW";

export interface ReservationGuest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

export interface ReservationRoomLine {
  id: string;
  roomType: { id: string; name: string; code: string };
  room?: { id: string; roomNumber: string } | null;
  nightlyRate: number | string;
}

export interface Reservation {
  id: string;
  confirmationCode: string;
  status: ReservationStatus;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  currency: string;
  totalAmount: number | string;
  specialRequests?: string | null;
  guest: ReservationGuest;
  hotel: { id: string; name: string };
  branch: { id: string; name: string; code: string };
  rooms: ReservationRoomLine[];
}

export interface ReservationListItem extends Reservation {}