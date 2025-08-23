import {create} from 'zustand';

const useTokenStore = create((set) => ({
    accessToken: null,
    refreshToken: null,
    setTokens: (accessToken, refreshToken) => set({accessToken, refreshToken}),
    updateAccessToken: (accessToken) => set((state) => ({...state, accessToken})),
    clearTokens: ()=> set({accessToken: null, refreshToken: null}),
}));

export default useTokenStore;