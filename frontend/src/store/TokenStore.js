import {create} from 'zustand';

const useTokenStore = create((set) => ({
    accessToken: null,
    refreshToken: null,
    setTokens: (accessToken, refreshToken) => set({accessToken, refreshToken}),
    clearTokens: ()=> set({accessToken: null, refreshToken: null}),
}));

export default useTokenStore;