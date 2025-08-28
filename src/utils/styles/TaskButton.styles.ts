import { StyleSheet } from 'react-native';

export const createTaskButtonStyles = () => StyleSheet.create({
  taskButton: {
    marginHorizontal: 6,
    borderRadius: 16,
    marginBottom: 0,
  },
  taskButtonGradient: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    flexDirection: 'row',
    height: 72,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  touchableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  buttonPressable: {
    opacity: 0.93,
  },
}); 