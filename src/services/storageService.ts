/**
 * METRALAB - Persistence & Data Service Layer
 * Supports reactive local persistence, referential integrity,
 * and seamless future migration to backend / database.
 */

import {
  DEFAULT_USERS,
  INITIAL_MANUFACTURERS,
  INITIAL_INSTRUMENTS,
  INITIAL_EVALUATIONS,
  INITIAL_REPORTS,
  INITIAL_EVIDENCE,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
} from '../data/mockData';
import {
  UserProfile,
  UserRole,
  Manufacturer,
  WeighingInstrument,
  Evaluation,
  TestReport,
  EvidenceFile,
  AuditLogEvent,
  LaboratorySettings,
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'metralab_current_user',
  MANUFACTURERS: 'metralab_manufacturers',
  INSTRUMENTS: 'metralab_instruments',
  EVALUATIONS: 'metralab_evaluations',
  REPORTS: 'metralab_reports',
  EVIDENCE: 'metralab_evidence',
  AUDIT_LOGS: 'metralab_audit_logs',
  SETTINGS: 'metralab_settings',
};

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  // --- User Profile & Role ---
  getCurrentUser(): UserProfile {
    const defaultUser = DEFAULT_USERS[0]; // Testing engineer by default
    return this.get<UserProfile>(STORAGE_KEYS.CURRENT_USER, defaultUser);
  }

  setCurrentUserRole(role: UserRole): UserProfile {
    const user = DEFAULT_USERS.find((u) => u.role === role) || DEFAULT_USERS[0];
    this.set(STORAGE_KEYS.CURRENT_USER, user);
    this.logAction('SWITCH_ROLE', 'settings', user.id, `Simulated role changed to ${user.designation} (${user.role})`);
    return user;
  }

  getUsers(): UserProfile[] {
    return DEFAULT_USERS;
  }

  // --- Manufacturers ---
  getManufacturers(): Manufacturer[] {
    return this.get<Manufacturer[]>(STORAGE_KEYS.MANUFACTURERS, INITIAL_MANUFACTURERS);
  }

  saveManufacturer(mfr: Manufacturer): void {
    const list = this.getManufacturers();
    const existingIndex = list.findIndex((m) => m.id === mfr.id);
    if (existingIndex >= 0) {
      list[existingIndex] = mfr;
    } else {
      list.unshift(mfr);
    }
    this.set(STORAGE_KEYS.MANUFACTURERS, list);
    this.logAction('SAVE_MANUFACTURER', 'instrument', mfr.id, `Registered/Updated manufacturer: ${mfr.name}`);
  }

  // --- Instruments ---
  getInstruments(): WeighingInstrument[] {
    return this.get<WeighingInstrument[]>(STORAGE_KEYS.INSTRUMENTS, INITIAL_INSTRUMENTS);
  }

  getInstrumentById(id: string): WeighingInstrument | undefined {
    return this.getInstruments().find((i) => i.id === id || i.instrumentId === id);
  }

  saveInstrument(inst: WeighingInstrument): void {
    const list = this.getInstruments();
    const existingIndex = list.findIndex((i) => i.id === inst.id);
    if (existingIndex >= 0) {
      list[existingIndex] = inst;
      this.logAction('UPDATE_INSTRUMENT', 'instrument', inst.id, `Updated technical specs for ${inst.instrumentId}`);
    } else {
      list.unshift(inst);
      this.logAction('REGISTER_INSTRUMENT', 'instrument', inst.id, `Registered new NAWI: ${inst.instrumentId} (${inst.modelDesignation})`);
    }
    this.set(STORAGE_KEYS.INSTRUMENTS, list);
  }

  // --- Evaluations ---
  getEvaluations(): Evaluation[] {
    return this.get<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, INITIAL_EVALUATIONS);
  }

  getEvaluationById(id: string): Evaluation | undefined {
    return this.getEvaluations().find((e) => e.id === id || e.evaluationNumber === id);
  }

  saveEvaluation(evalObj: Evaluation): void {
    const list = this.getEvaluations();
    const existingIndex = list.findIndex((e) => e.id === evalObj.id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...evalObj, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(evalObj);
      this.logAction('CREATE_EVALUATION', 'evaluation', evalObj.id, `Created new evaluation plan ${evalObj.evaluationNumber}`);
    }
    this.set(STORAGE_KEYS.EVALUATIONS, list);

    // Keep instrument status in sync if evaluation is approved or in progress
    const instrument = this.getInstrumentById(evalObj.instrumentId);
    if (instrument) {
      let newStatus = instrument.status;
      if (evalObj.status === 'approved' || evalObj.status === 'report_generated') {
        newStatus = 'approved';
      } else if (evalObj.status === 'in_progress' || evalObj.status === 'submitted') {
        newStatus = 'under_evaluation';
      }
      if (newStatus !== instrument.status) {
        this.saveInstrument({ ...instrument, status: newStatus });
      }
    }
  }

  // --- Reports ---
  getReports(): TestReport[] {
    return this.get<TestReport[]>(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  }

  getReportById(id: string): TestReport | undefined {
    return this.getReports().find((r) => r.id === id || r.reportNumber === id);
  }

  saveReport(rep: TestReport): void {
    const list = this.getReports();
    const existingIndex = list.findIndex((r) => r.id === rep.id);
    if (existingIndex >= 0) {
      list[existingIndex] = rep;
      this.logAction('REVISE_REPORT', 'report', rep.id, `Revised test report ${rep.reportNumber} (v${rep.version})`);
    } else {
      list.unshift(rep);
      this.logAction('GENERATE_REPORT', 'report', rep.id, `Generated official OIML test report ${rep.reportNumber}`);
    }
    this.set(STORAGE_KEYS.REPORTS, list);
  }

  // --- Evidence Files ---
  getEvidence(): EvidenceFile[] {
    return this.get<EvidenceFile[]>(STORAGE_KEYS.EVIDENCE, INITIAL_EVIDENCE);
  }

  addEvidence(ev: EvidenceFile): void {
    const list = this.getEvidence();
    list.unshift(ev);
    this.set(STORAGE_KEYS.EVIDENCE, list);
    this.logAction('ATTACH_EVIDENCE', 'evaluation', ev.associatedId, `Attached evidence document/image: ${ev.name}`);
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLogEvent[] {
    return this.get<AuditLogEvent[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  logAction(
    action: string,
    targetType: AuditLogEvent['targetType'],
    targetId: string,
    details: string
  ): void {
    const user = this.getCurrentUser();
    const newLog: AuditLogEvent = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorName: user.name,
      actorRole: user.role,
      action,
      targetType,
      targetId,
      details,
    };
    const logs = this.getAuditLogs();
    logs.unshift(newLog);
    // Keep max 200 logs in demo mode
    if (logs.length > 200) logs.pop();
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // --- Laboratory Settings ---
  getSettings(): LaboratorySettings {
    return this.get<LaboratorySettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  saveSettings(settings: LaboratorySettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
    this.logAction('UPDATE_SETTINGS', 'settings', 'lab_config', 'Updated laboratory contact and accreditation preferences');
  }

  // --- Demo Reset ---
  resetToDemoDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.MANUFACTURERS);
    localStorage.removeItem(STORAGE_KEYS.INSTRUMENTS);
    localStorage.removeItem(STORAGE_KEYS.EVALUATIONS);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.EVIDENCE);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }
}

export const storageService = new StorageService();
