import axios from "axios";

const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
apiClient.interceptors.response.use(
    (response) => response,
                                    (error) => {
                                        if (error.response?.status === 401) {
                                            // Token expired or invalid
                                            localStorage.removeItem('token');
                                            localStorage.removeItem('user');
                                            window.location.href = '/login';
                                        }
                                        return Promise.reject(error);
                                    }
);

export const register = async (username: string, email: string, password: string) => {
    return apiClient.post('/auth/register', { username, email, password });
};

export const login = async (username: string, password: string) => {
    return apiClient.post('/auth/login', { username, password });
};
export const googleLogin = () => {
    window.location.href = 'http://localhost:8000/auth/google';
};

export const githubLogin = () => {
    window.location.href = 'http://localhost:8000/auth/github';
};

export const getCurrentUser = async () => {
    return apiClient.get('/auth/me');
};
export const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return apiClient.post('/auth/logout');
};
export const getLabs = async () => {
    return apiClient.get('/labs');
};

export const getLab = async (id: string) => {
    return apiClient.get(`/labs/${id}`);
};

export const startLab = async (id: string) => {
    return apiClient.post(`/labs/${id}/start`);
};

export const stopLab = async (id: string) => {
    return apiClient.post(`/labs/${id}/stop`);
};

export default apiClient;
