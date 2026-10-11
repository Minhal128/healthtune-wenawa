import type { Appointment, AppointmentsResponse } from '@/features/appointments/api/appointments.api';
import type { Patient } from '@/features/patients/types/patient';
import type {
  ConsolidatedNotesResponse,
  Session,
  SessionDetails,
  SessionsResponse,
} from '@/features/patient-sessions/types/session';
import type { Note } from '@/features/quick-notes/types/note';
import type { Template } from '@/features/templates/types/template';

function todayAt(hours: number, minutes = 0): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  // Backend-style local clock with Z suffix (see dateUtils.parseUTCDate)
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00.000Z`;
}

const emptyAddress = {
  streetAddress: '123 Clinic Rd',
  city: 'Karachi',
  area: null,
  postalCode: null,
  country: 'PK',
};

const emptyContact = {
  phoneNumber: '+923001234567',
  emergencyContactName: null,
  emergencyContactRelationship: null,
  emergencyContactPhone: null,
};

const emptyMedical = {
  bloodType: null,
  medicalHistory: null,
  allergies: null,
  currentMedications: null,
  chronicDiseases: null,
  surgicalHistory: null,
  isSmoker: false,
  isAlcoholic: false,
};

const emptyInsurance = {
  isInsured: false,
  insuranceProvider: null,
  insurancePolicyNumber: null,
  insuranceExpiryDate: null,
};

const emptyAdmission = {
  isDischarged: null,
  admissionReason: null,
  roomNumber: null,
  admissionDate: null,
  dischargeDate: null,
};

export const MOCK_PATIENT: Patient = {
  id: 1,
  createdAt: todayAt(9),
  updatedAt: todayAt(9),
  mreNumber: 'MRE-1001',
  firstName: 'Ayesha',
  lastName: 'Khan',
  email: 'ayesha.khan@example.com',
  dateOfBirth: '1990-05-12',
  gender: 'Female',
  maritalStatus: 'Married',
  nationality: 'Pakistani',
  occupation: null,
  profileImage: null,
  doctorId: 1,
  address: emptyAddress,
  contactDetails: emptyContact,
  medicalDetails: emptyMedical,
  insuranceDetails: emptyInsurance,
  admissionDetails: emptyAdmission,
  appointments: [
    {
      id: 101,
      patientId: 1,
      doctorId: 1,
      appointmentDate: todayAt(10, 30),
      status: 'Scheduled',
      reasonForVisit: 'Follow-up',
      notes: null,
      appointmentType: 'Telehealth',
      consultationFee: 50,
      duration: '30',
      location: 'Virtual',
      isTelemedicine: true,
      roomNumber: null,
      color: '#134e4a',
      isCompleted: false,
      sessionId: null,
      createdAt: todayAt(9),
      updatedAt: todayAt(9),
    },
  ],
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 101,
    patientId: 1,
    doctorId: 1,
    appointmentDate: todayAt(10, 30),
    status: 'Scheduled',
    reasonForVisit: 'Follow-up',
    notes: '',
    appointmentType: 'Telehealth',
    consultationFee: '50',
    duration: '30',
    location: 'Virtual',
    isTelemedicine: true,
    roomNumber: '',
    color: '#134e4a',
    sessionId: null,
    createdAt: todayAt(9),
    updatedAt: todayAt(9),
    doctor: {
      email: 'mock@healthtune.io',
      firstName: 'Mock',
      lastName: 'Clinician',
      username: 'mock.doctor',
    },
    patient: {
      mreNumber: 'MRE-1001',
      firstName: 'Ayesha',
      lastName: 'Khan',
      email: 'ayesha.khan@example.com',
    },
  },
];

export const MOCK_APPOINTMENTS_RESPONSE: AppointmentsResponse = {
  message: 'ok',
  data: MOCK_APPOINTMENTS,
  page: 1,
  total: MOCK_APPOINTMENTS.length,
  lastPage: 1,
};

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 1,
    createdAt: todayAt(8),
    updatedAt: todayAt(8),
    title: 'SOAP',
    prompt: 'Generate SOAP notes from the transcript.',
    language: 'en',
  },
  {
    id: 2,
    createdAt: todayAt(8),
    updatedAt: todayAt(8),
    title: 'Progress Note',
    prompt: 'Generate a progress note from the transcript.',
    language: 'en',
  },
];

export const MOCK_SESSION: Session = {
  id: 501,
  createdAt: todayAt(11),
  updatedAt: todayAt(11),
  patientName: 'Ayesha Khan',
  sex: 'Female',
  sessionType: 'Telehealth',
  noteFormat: 'SOAP',
  language: 'en',
  duration: '12',
  status: 'Completed',
  audioFile: null,
  userId: 1,
  patientId: 1,
  note: {
    id: 1,
    sessionId: 501,
    content: { note: '## SOAP\n\n**S:** Patient reports improved sleep.\n**O:** Calm affect.\n**A:** Responding to treatment.\n**P:** Continue current plan.' },
    createdAt: todayAt(11),
  },
  transcript: {
    id: 1,
    sessionId: 501,
    assemblyId: 'mock-assembly',
    content: { transcript: 'Doctor: How are you feeling today?\nPatient: Better than last week.' },
    createdAt: todayAt(11),
  },
  doctorNotes: null,
  diagnosisCodes: null,
};

export const MOCK_SESSION_DETAILS: SessionDetails = {
  ...MOCK_SESSION,
  patient: {
    id: 1,
    createdAt: todayAt(9),
    updatedAt: todayAt(9),
    mreNumber: 'MRE-1001',
    firstName: 'Ayesha',
    lastName: 'Khan',
    email: 'ayesha.khan@example.com',
    languagePreference: 'en',
    dateOfBirth: '1990-05-12',
    gender: 'Female',
    maritalStatus: 'Married',
    nationality: 'Pakistani',
    occupation: null,
    profileImage: null,
    doctorId: 1,
    address: emptyAddress,
    contactDetails: emptyContact,
    medicalDetails: emptyMedical,
    insuranceDetails: {
      isInsured: false,
      insuranceProvider: null,
      insurancePolicyNumber: null,
      insuranceExpiryDate: null,
      effectiveDate: null,
      type: '',
    },
    admissionDetails: emptyAdmission,
  },
};

export const MOCK_SESSIONS_RESPONSE: SessionsResponse = {
  message: 'ok',
  data: [MOCK_SESSION],
  page: 1,
  total: 1,
  lastPage: 1,
};

export const MOCK_NOTES: Note[] = [
  {
    id: '1',
    title: 'Quick note — morning',
    description: 'Mock voice note',
    file: 'mock-recording.m4a',
    audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    duration: 95,
    createdAt: todayAt(9, 15),
    updatedAt: todayAt(9, 15),
    transcript: 'Patient mentioned improved mood and sleep over the weekend.',
    speakers: [],
    thumbnailColor: '#134e4a',
  },
];

export const MOCK_CONSOLIDATED_NOTES: ConsolidatedNotesResponse = {
  sessionNotes: '## SOAP\n\n**S:** Improved sleep.\n**O:** Calm.\n**A:** Stable.\n**P:** Follow up in 2 weeks.',
  diagnosis: { icd10Codes: [], atcCodes: [] },
  summary: 'Stable progress; continue plan.',
  tokenUsage: { input: 100, output: 50, total: 150 },
  cost: { input: 0, output: 0, total: 0 },
};
