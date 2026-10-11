export interface CreateSessionPayload {
  patientId: string;
  sex: string;
  sessionType: string;
  noteFormat: string;
  language: string;
  appointmentId?: string;
}

export interface NoteCost {
  input: number;
  total: number;
  output: number;
}

export interface NoteTokenUsage {
  input: number;
  total: number;
  output: number;
}

export interface NoteContent {
  cost: NoteCost;
  text: string;
  tokenUsage: NoteTokenUsage;
}

export interface Note {
  id: number;
  sessionId: number;
  content: {
    note: string; // Changed from content to note to match backend
  };
  createdAt: string;
}

export interface Transcript {
  id: number;
  sessionId: number;
  assemblyId: string;
  content: {
    transcript: string; // Changed to match backend structure
  };
  createdAt: string;
}

export interface DoctorNotes {
  id: number;
  sessionId: number;
  content: {
    note: string; // Changed from content to note to match backend
  };
  createdAt: string;
}

export interface ICD10Code {
  code: string;
  description: string;
}

export interface ATCCode {
  medicineName: string;
  code: string;
}

export interface Diagnosis {
  icd10Codes: ICD10Code[];
  atcCodes: ATCCode[];
}

export interface DiagnosisCodes {
  id: number;
  sessionId: number;
  content: {
    note: string; // Changed from content to transcript to match backend
  };
  createdAt: string;
}

export interface Patient {
  id: number;
  createdAt: string;
  updatedAt: string;
  mreNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  languagePreference: string;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  occupation: string | null;
  profileImage: string | null;
  doctorId: number;
  organizationId?: number; // Added to match backend
  address: {
    streetAddress: string | null;
    city: string | null;
    area: string | null;
    postalCode: string | null;
    country: string | null;
  };
  contactDetails: {
    phoneNumber: string | null;
    emergencyContactName: string | null;
    emergencyContactRelationship: string | null;
    emergencyContactPhone: string | null;
  };
  medicalDetails: {
    bloodType: string | null;
    medicalHistory: string | null;
    allergies: string | null;
    currentMedications: string | null;
    chronicDiseases: string | null;
    surgicalHistory: string | null;
    isSmoker: boolean;
    isAlcoholic: boolean;
  };
  insuranceDetails: {
    isInsured: boolean;
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
    insuranceExpiryDate: string | null;
    effectiveDate: string | null;
    type: string;
  };
  admissionDetails: {
    isDischarged: boolean | null;
    admissionReason: string | null;
    roomNumber: string | null;
    admissionDate: string | null;
    dischargeDate: string | null;
  };
}

export interface Session {
  id: number;
  createdAt: string;
  updatedAt: string;
  patientName: string;
  sex: string | null;
  sessionType: string;
  noteFormat: string;
  language: string;
  duration: string;
  status: string;
  audioFile: string | null;
  userId: number;
  patientId: number;
  note: Note | null;
  transcript: Transcript | null;
  doctorNotes: DoctorNotes | null;
  diagnosisCodes: DiagnosisCodes | null;
}

export interface SessionDetails extends Session {
  patient: Patient;
}

export interface SessionsResponse {
  message: string;
  data: Session[];
  page: number;
  total: number;
  lastPage: number;
}

export interface SessionDetailsResponse {
  message: string;
  data: SessionDetails;
}

export interface CreateSessionResponse {
  message: string;
  data: Session;
}

export interface TranscriptContent {
  transcript: string;
}

export interface UpdateTranscriptPayload {
  content: TranscriptContent;
  assemblyId: string;
  duration: number;
}

export interface UpdateNotePayload {
  content: {
    note: NoteContent;
  };
}

export interface SessionNotesPayload {
  transcript: string; // JSON string containing transcript data
  patient: string;
  sex: string;
  noteFormat: string;
  sessionType: string;
  notes?: string;
  language?: string;
}

export interface ConsolidatedNotesResponse {
  sessionNotes: string;
  diagnosis: Diagnosis;
  summary: string;
  tokenUsage: NoteTokenUsage;
  cost: NoteCost;
}

export interface SessionDetailsUpdateData {
  summary?: string;
  doctorNotes?: string;
  diagnosisCodes?: Diagnosis;
  transcript?: {
    assemblyId: string;
    content: string;
    duration: number;
  };
  cost?: {
    patient: string;
    doctor: string;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalInputCost: number;
    totalOutputCost: number;
    totalSessionCost: number;
    operations: string[];
  };
  sessionAudio?: string;
  noteFormat?: string;
} 