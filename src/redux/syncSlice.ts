import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  lastSyncTime: string | null;
}

const initialState: SyncState = {
  lastSyncTime: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setLastSyncTime(state, action: PayloadAction<string | null>) {
      state.lastSyncTime = action.payload;
    },
  },
});

export const { setLastSyncTime } = syncSlice.actions;
export const selectLastSyncTime = (state: { sync: SyncState }) => state.sync.lastSyncTime;
export default syncSlice.reducer; 