import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { createErrorStateStyles } from '../utils/styles/ErrorState.styles';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  showContactSupport?: boolean;
  supportEmail?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onRetry,
  showContactSupport = true,
  supportEmail = 'support@company.com',
}) => {
  const styles = createErrorStateStyles();

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Dashboard Data Loading Issue');
    const body = encodeURIComponent(
      `Hi Support Team,\n\nI'm experiencing an issue with loading dashboard data.\n\nError Details:\n- Title: ${title}\n- Message: ${message}\n\nPlease help me resolve this issue.\n\nBest regards,\n[Your Name]`
    );
    
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    
    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mailtoUrl);
        } else {
          console.log('Email app not available');
        }
      })
      .catch((err) => {
        console.error('Error opening email app:', err);
      });
  };

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
      
      {showContactSupport && (
        <TouchableOpacity style={styles.contactSupportButton} onPress={handleContactSupport}>
          <Text style={styles.contactSupportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorState; 