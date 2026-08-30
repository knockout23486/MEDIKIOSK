import { db } from '../db/store.js';
import { QueueToken } from '../db/schema.js';

export class QueueEngine {
  /**
   * Issues an OPD queue token for an appointment (idempotent per appointment).
   * The token number is allocated from a PostgreSQL sequence, so simultaneous
   * bookings can never be handed the same number.
   */
  public static async generateToken(
    patientId: string,
    appointmentId: string,
    practitionerId: string
  ): Promise<QueueToken> {
    return db.queue.ensureToken(patientId, appointmentId, practitionerId);
  }

  /**
   * Advances the OPD queue for a practitioner. Candidate rows are locked with
   * SELECT ... FOR UPDATE inside a SQL transaction so concurrent triage desks
   * can never call the same patient twice.
   */
  public static async advanceQueue(practitionerId: string): Promise<QueueToken | null> {
    return db.queue.advance(practitionerId);
  }
}
