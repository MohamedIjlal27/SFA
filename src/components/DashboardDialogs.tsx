import React from 'react';
import { Portal, Dialog, Text, Button, useTheme } from 'react-native-paper';

interface DashboardDialogsProps {
  showLogoutModal: boolean;
  showDayToggleModal: boolean;
  isDayStarted: boolean;
  onDismissLogout: () => void;
  onDismissDayToggle: () => void;
  onConfirmLogout: () => void;
  onConfirmDayToggle: () => void;
}

const DashboardDialogs: React.FC<DashboardDialogsProps> = ({
  showLogoutModal,
  showDayToggleModal,
  isDayStarted,
  onDismissLogout,
  onDismissDayToggle,
  onConfirmLogout,
  onConfirmDayToggle,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      {/* Logout Confirmation Dialog */}
      <Dialog visible={showLogoutModal} onDismiss={onDismissLogout}>
        <Dialog.Title>Confirm Logout</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">Are you sure you want to log out?</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismissLogout}>Cancel</Button>
          <Button onPress={onConfirmLogout} mode="contained">Logout</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Day Toggle Confirmation Dialog */}
      <Dialog visible={showDayToggleModal} onDismiss={onDismissDayToggle}>
        <Dialog.Title>{isDayStarted ? 'End Day?' : 'Start Day?'}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            {isDayStarted 
              ? 'Are you sure you want to end your day?' 
              : 'Are you sure you want to start your day?'
            }
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismissDayToggle}>No</Button>
          <Button 
            onPress={onConfirmDayToggle} 
            mode="contained"
            buttonColor={isDayStarted ? theme.colors.error : theme.colors.primary}
          >
            Yes
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default DashboardDialogs; 