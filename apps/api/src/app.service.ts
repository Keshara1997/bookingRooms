import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'bookingRooms API';
  }

  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}