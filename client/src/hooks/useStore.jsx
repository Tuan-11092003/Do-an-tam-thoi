import { useContext } from 'react';
import Context from '../store/Context';

export const useStore = () => {
    const contextValue = useContext(Context);
    return contextValue;
};
