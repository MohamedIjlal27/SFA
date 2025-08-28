import { configureStore } from '@reduxjs/toolkit';
import syncReducer from './syncSlice';

export const store = configureStore({
  reducer: {
    sync: syncReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 