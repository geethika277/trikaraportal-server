import * as React from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 4000;

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
};

let count = 0;
const genId = () => (++count).toString();

const toastTimeouts = new Map();

function reducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case actionTypes.UPDATE_TOAST:
      return { ...state, toasts: state.toasts.map(t => t.id === action.toast.id ? { ...t, ...action.toast } : t) };
    case actionTypes.DISMISS_TOAST:
      return { ...state, toasts: state.toasts.map(t => t.id === action.toastId ? { ...t, open: false } : t) };
    case actionTypes.REMOVE_TOAST:
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.toastId) };
    default:
      return state;
  }
}

const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach(l => l(memoryState));
}

function toast({ ...props }) {
  const id = genId();
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
  const update = (props) => dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...props, id } });

  dispatch({ type: actionTypes.ADD_TOAST, toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss(); } } });

  const timeout = setTimeout(() => {
    dismiss();
    setTimeout(() => dispatch({ type: actionTypes.REMOVE_TOAST, toastId: id }), 300);
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(id, timeout);

  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1); };
  }, []);
  return { ...state, toast, dismiss: (id) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id }) };
}

export { useToast, toast };
