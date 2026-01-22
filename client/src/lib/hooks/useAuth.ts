import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export const useAuth = () => {
    const { user, token, isAuthenticated, loading, error } = useSelector(
        (state: RootState) => state.auth
    );

    return {
        user,
        token,
        isAuthenticated,
        loading,
        error,
    };
};
