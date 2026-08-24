export const saveToken = (token) => {
    localStorage.setItem('paltenders_token', token);
};

export const getToken = () => {
    return localStorage.getItem('paltenders_token');
};

export const clearToken = () => {
    localStorage.removeItem('paltenders_token');
};

export const saveUser = (user) => {
    localStorage.setItem('paltenders_user', JSON.stringify(user));
};

export const getStoredUser = () => {
    const userStr = localStorage.getItem('paltenders_user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

export const clearUser = () => {
    localStorage.removeItem('paltenders_user');
};
