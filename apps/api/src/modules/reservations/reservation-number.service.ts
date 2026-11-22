
import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";

@Injectable()
export class ReservationNumberService {
  /**
   * Generates a human-readable reservation confirmation code.
   *
   * Example:
   * BR-20261122-A1B2C3D4
   */
  generate(): string {
    const date = new Date();

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    const randomCode = randomBytes(4)
      .toString("hex")
      .toUpperCase();

    return `BR-${year}${month}${day}-${randomCode}`;
  }
}
