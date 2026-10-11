import { MOCK_PATIENT } from '@/features/shared/mock/fixtures';
import axios from '@/utils/config/axios-instance';
import { MOCK_MODE } from '@/utils/constants';
import { Patient, PatientsResponse } from '../types/patient';

export const PatientsAPI = {
  getAllPatients: async (page: number = 1, limit: number = 10000): Promise<Patient[]> => {
    if (MOCK_MODE) {
      return [MOCK_PATIENT];
    }
    try {
      const response = await axios.get<PatientsResponse>('/patient/by-appointment', {
        params: {
          page,
          limit,
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw new Error('Failed to fetch patients');
    }
  },

  getPatientById: async (id: string): Promise<Patient | null> => {
    if (MOCK_MODE) {
      return String(MOCK_PATIENT.id) === id ? MOCK_PATIENT : MOCK_PATIENT;
    }
    try {
      const response = await axios.get(`/patient/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw new Error('Failed to fetch patient');
    }
  },
};

export default PatientsAPI; 