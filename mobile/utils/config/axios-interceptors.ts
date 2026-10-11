import { MOCK_MODE } from '@/utils/constants';
import { getClerkInstance } from '@clerk/clerk-expo';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from './axios-instance';

const PUBLIC_ENDPOINTS = [
  '/auth/login/',
  '/auth/signup/',
  '/auth/token/refresh/',
  '/auth/oidc/login/',
];
const refreshTokenEndpoint = `/auth/token/refresh/`;

const requestHandler = async (request: InternalAxiosRequestConfig) => {
  if (!MOCK_MODE) {
    const clerkInstance = getClerkInstance();
    const token = await clerkInstance.session?.getToken();

    if (!!request.url && !PUBLIC_ENDPOINTS.includes(request.url)) {
      if (token && request.url !== refreshTokenEndpoint) {
        request.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }
  request.timeout = 60000;
  return request;
};

const responseHandler = async (response: AxiosResponse) => {
  return response;
};

const errorHandler = async (err: any) => {
  if (MOCK_MODE) {
    return Promise.reject(err);
  }

  const clerkInstance = getClerkInstance();
  const originalConfig = err.config;

  if (
    !PUBLIC_ENDPOINTS.includes(
      originalConfig.url.split('?')[0] ? originalConfig.url.split('?')[0] : originalConfig.url
    ) &&
    err.response
  ) {
    if (err.response.status === 401) {
      await clerkInstance.signOut();
    }
  }
  return Promise.reject(err);
};

const setup = () => {
  axios.interceptors.request.use(
    (request: InternalAxiosRequestConfig) => requestHandler(request),
    (error: AxiosError) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response: AxiosResponse) => responseHandler(response),
    (error: AxiosError) => errorHandler(error)
  );
};

export default setup;
