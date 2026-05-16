/**
 * Redux slice: modal state.
 *
 * Controls the global error/success modal displayed by the shared
 * <ModalProvider /> component. Microfrontends dispatch actions from here
 * to show/hide modals without managing their own local UI state.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ModalConfig } from '../../types';

export interface ModalState {
  isOpen: boolean;
  config: ModalConfig | null;
}

const initialState: ModalState = {
  isOpen: false,
  config: null,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    showModal(state, action: PayloadAction<ModalConfig>) {
      state.isOpen = true;
      state.config = action.payload;
    },
    hideModal(state) {
      state.isOpen = false;
      // Keep config briefly so the modal can animate out
    },
    clearModal(state) {
      state.isOpen = false;
      state.config = null;
    },
  },
});

export const { showModal, hideModal, clearModal } = modalSlice.actions;
export default modalSlice.reducer;
