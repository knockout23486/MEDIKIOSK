import { db } from '../db/store.js';
import { QueueToken } from '../db/schema.js';

export class QueueEngine {
  public static generateToken(patientId: string, appointmentId: string, practitionerId: string): QueueToken {
    const state = db.getState();
    const existing = state.queueTokens.find(t => t.appointmentId === appointmentId);
    if (existing) return existing;

    const count = state.queueTokens.length + 1;
    const tokenNumber = 'A-' + String(count + 20).padStart(3, '0');

    // Calculate approximate wait time based on tokens ahead
    const waitingTokens = state.queueTokens.filter(t => t.practitionerId === practitionerId && t.status === 'WAITING');
    const estimatedWaitMins = (waitingTokens.length + 1) * 12;

    const token: QueueToken = {
      id: 'TOK-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tokenNumber,
      appointmentId,
      patientId,
      practitionerId,
      status: 'WAITING',
      priority: 'NORMAL',
      estimatedWaitMins,
      checkInTime: new Date().toISOString()
    };

    state.queueTokens.push(token);
    db.save();

    // Broadcast SSE update
    db.broadcast('QUEUE_UPDATED', { token, queueLength: state.queueTokens.length });

    return token;
  }

  public static advanceQueue(practitionerId: string): QueueToken | null {
    const state = db.getState();
    const currentActive = state.queueTokens.find(t => t.practitionerId === practitionerId && t.status === 'WITH_DOCTOR');
    if (currentActive) {
      currentActive.status = 'COMPLETED';
      currentActive.completedTime = new Date().toISOString();
    }

    // Call urgent triage first, then normal waiting
    let nextToken = state.queueTokens.find(t => t.practitionerId === practitionerId && t.status === 'TRIAGE_URGENT');
    if (!nextToken) {
      nextToken = state.queueTokens.find(t => t.practitionerId === practitionerId && t.status === 'WAITING');
    }

    if (nextToken) {
      nextToken.status = 'WITH_DOCTOR';
      nextToken.calledTime = new Date().toISOString();
      nextToken.estimatedWaitMins = 0;
    }

    // Recalculate remaining wait times
    const remaining = state.queueTokens.filter(t => t.practitionerId === practitionerId && t.status === 'WAITING');
    remaining.forEach((t, idx) => {
      t.estimatedWaitMins = (idx + 1) * 10;
    });

    db.save();
    db.broadcast('QUEUE_ADVANCED', { currentDoctor: practitionerId, activeToken: nextToken });

    return nextToken || null;
  }
}
