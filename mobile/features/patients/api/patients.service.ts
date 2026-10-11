import { useQuery } from '@tanstack/react-query';
import { PatientsAPI } from './patients.api';

export const usePatientsService = () => {
  const usePatients = (page: number = 1, limit: number = 10000) => {
    return useQuery({
      queryKey: ['patients', page, limit],
      queryFn: () => PatientsAPI.getAllPatients(page, limit),
    });
  };

  const usePatient = (id: string) => {
    return useQuery({
      queryKey: ['patient', id],
      queryFn: () => PatientsAPI.getPatientById(id),
      enabled: !!id,
    });
  };

  return {
    usePatients,
    usePatient,
  };
};

export default usePatientsService; 