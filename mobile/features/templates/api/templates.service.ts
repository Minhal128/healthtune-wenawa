import { useQuery } from '@tanstack/react-query';
import { TemplatesAPI } from './templates.api';

export const useTemplatesService = () => {
  const useTemplates = (page: number = 1, limit: number = 10000) => {
    return useQuery({
      queryKey: ['templates', page, limit],
      queryFn: () => TemplatesAPI.getAllTemplates(page, limit),
    });
  };

  const useTemplate = (id: string) => {
    return useQuery({
      queryKey: ['template', id],
      queryFn: () => TemplatesAPI.getTemplateById(id),
      enabled: !!id,
    });
  };

  return {
    useTemplates,
    useTemplate,
  };
};

export default useTemplatesService; 