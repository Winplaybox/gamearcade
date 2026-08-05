import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlertModal from '../components/ui/CustomAlertModal';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((title, message, buttons = []) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // Wrap button callbacks to also close the modal automatically
  const wrappedButtons = alertConfig.buttons.map((btn) => ({
    ...btn,
    onPress: () => {
      hideAlert();
      if (btn.onPress) {
        // slight delay to allow modal close animation if necessary
        setTimeout(() => btn.onPress(), 10);
      }
    },
  }));

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={wrappedButtons}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within an AlertProvider');
  }
  return context;
}
