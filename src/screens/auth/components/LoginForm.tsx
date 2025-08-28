import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

interface LoginFormProps {
  styles: any;
  companyId: string;
  userId: string;
  password: string;
  error: string;
  isLoading: boolean;
  onCompanyIdChange: (text: string) => void;
  onUserIdChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  styles,
  companyId,
  userId,
  password,
  error,
  isLoading,
  onCompanyIdChange,
  onUserIdChange,
  onPasswordChange,
  onLogin,
}) => {
  return (
    <View style={styles.formContainer}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Company ID</Text>
        <TextInput
          style={styles.input}
          value={companyId}
          onChangeText={onCompanyIdChange}
          placeholder="Enter Company ID"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>User ID</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={onUserIdChange}
          placeholder="Enter User ID"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={onPasswordChange}
          placeholder="Enter Password"
          placeholderTextColor="#999"
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={onLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loginButtonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default LoginForm; 