export interface PatientAddress {
  streetAddress: string | null;
  city: string | null;
  area: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface PatientContactDetails {
  phoneNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactRelationship: string | null;
  emergencyContactPhone: string | null;
}

export interface PatientMedicalDetails {
  bloodType: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  currentMedications: string | null;
  chronicDiseases: string | null;
  surgicalHistory: string | null;
  isSmoker: boolean;
  isAlcoholic: boolean;
}

export interface PatientInsuranceDetails {
  isInsured: boolean;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiryDate: string | null;
}

export interface PatientAdmissionDetails {
  isDischarged: boolean | null;
  admissionReason: string | null;
  roomNumber: string | null;
  admissionDate: string | null;
  dischargeDate: string | null;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  status: string;
  reasonForVisit: string | null;
  notes: string | null;
  appointmentType: string;
  consultationFee: number | null;
  duration: string;
  location: string | null;
  isTelemedicine: boolean;
  roomNumber: string | null;
  color: string;
  isCompleted: boolean;
  sessionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: number;
  createdAt: string;
  updatedAt: string;
  mreNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  occupation: string | null;
  profileImage: string | null;
  doctorId: number;
  address: PatientAddress;
  contactDetails: PatientContactDetails;
  medicalDetails: PatientMedicalDetails;
  insuranceDetails: PatientInsuranceDetails;
  admissionDetails: PatientAdmissionDetails;
  appointments?: Appointment[];
}

export interface PatientsResponse {
  message: string;
  data: Patient[];
  page: number;
  total: number;
  lastPage: number;
} 