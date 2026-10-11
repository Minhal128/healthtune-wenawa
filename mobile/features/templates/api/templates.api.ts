import { MOCK_TEMPLATES } from '@/features/shared/mock/fixtures';
import axios from '@/utils/config/axios-instance';
import { MOCK_MODE } from '@/utils/constants';
import { Template, TemplatesResponse } from '../types/template';

export const TemplatesAPI = {
  getAllTemplates: async (page: number = 1, limit: number = 10000): Promise<Template[]> => {
    if (MOCK_MODE) {
      return MOCK_TEMPLATES;
    }
    try {
      const response = await axios.get<TemplatesResponse>('/template', {
        params: {
          page,
          limit,
        },
        headers: {
          "Accept-Language": "en",
        },
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Failed to fetch templates');
    }
  },

  getTemplateById: async (id: string): Promise<Template | null> => {
    if (MOCK_MODE) {
      return MOCK_TEMPLATES.find((t) => String(t.id) === id) || MOCK_TEMPLATES[0];
    }
    try {
      const response = await axios.get(`/template/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw new Error('Failed to fetch template');
    }
  },
};

export default TemplatesAPI; 