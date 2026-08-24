import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../functions/api';
import { saveToken, getToken, clearToken, saveUser, getStoredUser, clearUser } from '../functions/auth';
import Spinner from './Spinner';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser());
    const [token, setToken] = useState(getToken());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await api.get('/api/users/me');
                const userData = res.data.user;
                if (userData && userData._id && !userData.id) {
                    userData.id = userData._id;
                }
                setUser(userData);
                saveUser(userData);
            } catch (err) {
                console.error("Session verification failed", err);
                logout();
            } finally {
                setIsLoading(false);
            }
        };

        verifySession();
    }, [token]);

    const login = (userData, authToken) => {
        if (userData && userData._id && !userData.id) {
            userData.id = userData._id;
        }
        setUser(userData);
        setToken(authToken);
        saveUser(userData);
        saveToken(authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        clearUser();
        clearToken();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner label="جاري التحقق من الجلسة..." />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
