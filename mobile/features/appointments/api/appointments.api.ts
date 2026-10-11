import { MOCK_APPOINTMENTS_RESPONSE } from '@/features/shared/mock/fixtures';
import axios from '@/utils/config/axios-instance';
import { MOCK_MODE } from '@/utils/constants';

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  status: string;
  reasonForVisit: string | null;
  notes: string;
  appointmentType: string;
  consultationFee: string;
  duration: string;
  location: string;
  isTelemedicine: boolean;
  roomNumber: string;
  color: string;
  sessionId: number | null;
  createdAt: string;
  updatedAt: string;
  doctor: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
  patient: {
    mreNumber: string;
    firstName: string;
    lastName: string;
    email: string | null;
  };
}

export interface AppointmentsResponse {
  message: string;
  data: Appointment[];
  page: number;
  total: number;
  lastPage: number;
}

export const AppointmentsAPI = {
  getUserAppointments: async (
    page: number = 1,
    limit: number = 10,
    patientId?: number,
    status?: string,
    appointmentType?: string,
    minConsultationFee?: number,
    maxConsultationFee?: number,
    isTelemedicine?: boolean,
    location?: string,
    startDate?: string,
    endDate?: string,
    sort?: string,
    query?: string
  ): Promise<AppointmentsResponse> => {
    if (MOCK_MODE) {
      return MOCK_APPOINTMENTS_RESPONSE;
    }
    try {
      const params: any = {
        page,
        limit,
      };

      if (patientId) params.patientId = patientId;
      if (status) params.status = status;
      if (appointmentType) params.appointmentType = appointmentType;
      if (minConsultationFee) params.minConsultationFee = minConsultationFee;
      if (maxConsultationFee) params.maxConsultationFee = maxConsultationFee;
      if (isTelemedicine !== undefined) params.isTelemedicine = isTelemedicine;
      if (location) params.location = location;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (sort) params.sort = sort;
      if (query) params.query = query;

      const response = await axios.get<AppointmentsResponse>('/appointment', {
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw new Error('Failed to fetch appointments');
    }
  },
};

export default AppointmentsAPI; 