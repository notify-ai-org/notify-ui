/**
 * useModal hook
 *
 * Reads modal state from Redux and exposes helpers for showing and hiding
 * the global modal. Microfrontends use this to trigger success confirmations
 * without coupling to the Redux dispatch API directly.
 *
 * Requires the component tree to be wrapped in a <Provider> with the shared store.
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { SharedRootState } from '../store';
import { showModal, hideModal, clearModal } from '../store/slices/modalSlice';
import type { ModalConfig } from '../types';
import type { ModalState } from '../store/slices/modalSlice';

export interface UseModalReturn {
  isOpen: boolean;
  config: ModalConfig | null;
  show: (config: ModalConfig) => void;
  hide: () => void;
  clear: () => void;
}

export function useModal(): UseModalReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatch = useDispatch<any>();
  const modalState = useSelector<SharedRootState, ModalState>(
    (state) => state.modal as ModalState,
  );

  const show = useCallback(
    (config: ModalConfig) => dispatch(showModal(config)),
    [dispatch],
  );

  const hide = useCallback(() => dispatch(hideModal()), [dispatch]);
  const clear = useCallback(() => dispatch(clearModal()), [dispatch]);

  return {
    isOpen: modalState.isOpen,
    config: modalState.config,
    show,
    hide,
    clear,
  };
}
