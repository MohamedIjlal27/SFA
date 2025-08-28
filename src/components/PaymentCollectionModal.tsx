import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { LinearGradient } from 'react-native-linear-gradient';
import PermissionService from '../services/permissionService';

interface ChequeDetails {
  chequeNumber: string;
  amount: string;
  imageUri?: string;
}

interface PaymentCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  customerId: string;
  onPaymentCollected?: (paymentData: any) => void;
}

type PaymentType = 'cash' | 'cheque' | 'bank_deposit';

const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = ({
  visible,
  onClose,
  customerId,
  onPaymentCollected,
}) => {
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cash payment fields
  const [cashAmount, setCashAmount] = useState('');

  // Cheque payment fields
  const [numberOfCheques, setNumberOfCheques] = useState('1');
  const [cheques, setCheques] = useState<ChequeDetails[]>([
    { chequeNumber: '', amount: '' }
  ]);

  // Bank deposit fields
  const [slipNumber, setSlipNumber] = useState('');
  const [slipAmount, setSlipAmount] = useState('');
  const [slipImageUri, setSlipImageUri] = useState('');

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setPaymentType('cash');
    setCashAmount('');
    setNumberOfCheques('1');
    setCheques([{ chequeNumber: '', amount: '' }]);
    setSlipNumber('');
    setSlipAmount('');
    setSlipImageUri('');
  };

  const handleNumberOfChequesChange = (value: string) => {
    const num = parseInt(value) || 1;
    setNumberOfCheques(value);
    
    const newCheques: ChequeDetails[] = [];
    for (let i = 0; i < num; i++) {
      newCheques.push({
        chequeNumber: cheques[i]?.chequeNumber || '',
        amount: cheques[i]?.amount || '',
        imageUri: cheques[i]?.imageUri || '',
      });
    }
    setCheques(newCheques);
  };

  const updateChequeField = (index: number, field: keyof ChequeDetails, value: string) => {
    const updatedCheques = [...cheques];
    updatedCheques[index] = { ...updatedCheques[index], [field]: value };
    setCheques(updatedCheques);
  };

  const takeChequePhoto = async (index: number) => {
    const permissionService = PermissionService.getInstance();
    const hasPermission = permissionService.getPermissionStatus().camera;
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required. Please grant permission in Settings.');
      permissionService.showPermissionSettingsAlert();
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      includeBase64: false,
      saveToPhotos: true,
    };

    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        updateChequeField(index, 'imageUri', file.uri || '');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickChequeImage = async (index: number) => {
    const permissionService = PermissionService.getInstance();
    const hasPermission = permissionService.getPermissionStatus().storage;
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required. Please grant permission in Settings.');
      permissionService.showPermissionSettingsAlert();
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      includeBase64: false,
      selectionLimit: 1,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        updateChequeField(index, 'imageUri', file.uri || '');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takeSlipPhoto = async () => {
    const permissionService = PermissionService.getInstance();
    const hasPermission = permissionService.getPermissionStatus().camera;
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera permission is required. Please grant permission in Settings.');
      permissionService.showPermissionSettingsAlert();
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      includeBase64: false,
      saveToPhotos: true,
    };

    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSlipImageUri(file.uri || '');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickSlipImage = async () => {
    const permissionService = PermissionService.getInstance();
    const hasPermission = permissionService.getPermissionStatus().storage;
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Storage permission is required. Please grant permission in Settings.');
      permissionService.showPermissionSettingsAlert();
      return;
    }

    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      includeBase64: false,
      selectionLimit: 1,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSlipImageUri(file.uri || '');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = (): boolean => {
    switch (paymentType) {
      case 'cash':
        if (!cashAmount || parseFloat(cashAmount) <= 0) {
          Alert.alert('Validation Error', 'Please enter a valid cash amount');
          return false;
        }
        break;
      
      case 'cheque':
        if (!numberOfCheques || parseInt(numberOfCheques) <= 0) {
          Alert.alert('Validation Error', 'Please enter number of cheques');
          return false;
        }
        
        for (let i = 0; i < cheques.length; i++) {
          const cheque = cheques[i];
          if (!cheque.chequeNumber.trim()) {
            Alert.alert('Validation Error', `Please enter cheque number for cheque ${i + 1}`);
            return false;
          }
          if (!cheque.amount || parseFloat(cheque.amount) <= 0) {
            Alert.alert('Validation Error', `Please enter valid amount for cheque ${i + 1}`);
            return false;
          }
          if (!cheque.imageUri) {
            Alert.alert('Validation Error', `Please take/select photo for cheque ${i + 1}`);
            return false;
          }
        }
        break;
      
      case 'bank_deposit':
        if (!slipNumber.trim()) {
          Alert.alert('Validation Error', 'Please enter slip number');
          return false;
        }
        if (!slipAmount || parseFloat(slipAmount) <= 0) {
          Alert.alert('Validation Error', 'Please enter a valid slip amount');
          return false;
        }
        if (!slipImageUri) {
          Alert.alert('Validation Error', 'Please take/select photo of the slip');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const paymentData = {
        customerId,
        paymentType,
        timestamp: new Date().toISOString(),
        ...(paymentType === 'cash' && { cashAmount: parseFloat(cashAmount) }),
        ...(paymentType === 'cheque' && { 
          numberOfCheques: parseInt(numberOfCheques),
          cheques: cheques.map(cheque => ({
            ...cheque,
            amount: parseFloat(cheque.amount)
          }))
        }),
        ...(paymentType === 'bank_deposit' && {
          slipNumber: slipNumber.trim(),
          slipAmount: parseFloat(slipAmount)
        })
      };

      // TODO: Call API to save payment data
      console.log('Payment data:', paymentData);
      
      Alert.alert('Success', 'Payment collected successfully!');
      onPaymentCollected?.(paymentData);
      onClose();
    } catch (error) {
      console.error('Error submitting payment:', error);
      Alert.alert('Error', 'Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCashPayment = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cash Payment</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Cash Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={cashAmount}
          onChangeText={setCashAmount}
          placeholder="Enter cash amount"
          keyboardType="numeric"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );

  const renderChequePayment = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cheque Payment</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Number of Cheques</Text>
        <TextInput
          style={styles.input}
          value={numberOfCheques}
          onChangeText={handleNumberOfChequesChange}
          placeholder="Enter number of cheques"
          keyboardType="numeric"
          placeholderTextColor="#666"
        />
      </View>

      {cheques.map((cheque, index) => (
        <View key={index} style={styles.chequeContainer}>
          <Text style={styles.chequeTitle}>Cheque {index + 1}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cheque Number</Text>
            <TextInput
              style={styles.input}
              value={cheque.chequeNumber}
              onChangeText={(value) => updateChequeField(index, 'chequeNumber', value)}
              placeholder="Enter cheque number"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={cheque.amount}
              onChangeText={(value) => updateChequeField(index, 'amount', value)}
              placeholder="Enter amount"
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.label}>Cheque Photo</Text>
            {cheque.imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: cheque.imageUri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => updateChequeField(index, 'imageUri', '')}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imageButtons}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => takeChequePhoto(index)}
                >
                  <Text style={styles.imageButtonText}>📷 Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => pickChequeImage(index)}
                >
                  <Text style={styles.imageButtonText}>🖼️ Select Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderBankDepositPayment = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bank Deposit Slip</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Slip Number</Text>
        <TextInput
          style={styles.input}
          value={slipNumber}
          onChangeText={setSlipNumber}
          placeholder="Enter slip number"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          value={slipAmount}
          onChangeText={setSlipAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.imageSection}>
        <Text style={styles.label}>Slip Photo</Text>
        {slipImageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: slipImageUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSlipImageUri('')}
            >
              <Text style={styles.removeImageText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={takeSlipPhoto}
            >
              <Text style={styles.imageButtonText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={pickSlipImage}
            >
              <Text style={styles.imageButtonText}>🖼️ Select Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
            <View style={styles.paymentModal}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
              >
                <Text style={styles.headerTitle}>Collect Payment</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>

              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Payment Type Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Type</Text>
                  <View style={styles.paymentTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.paymentTypeButton,
                        paymentType === 'cash' && styles.paymentTypeButtonActive
                      ]}
                      onPress={() => setPaymentType('cash')}
                    >
                      <Text style={[
                        styles.paymentTypeText,
                        paymentType === 'cash' && styles.paymentTypeTextActive
                      ]}>💵 Cash</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.paymentTypeButton,
                        paymentType === 'cheque' && styles.paymentTypeButtonActive
                      ]}
                      onPress={() => setPaymentType('cheque')}
                    >
                      <Text style={[
                        styles.paymentTypeText,
                        paymentType === 'cheque' && styles.paymentTypeTextActive
                      ]}>🏦 Cheque</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.paymentTypeButton,
                        paymentType === 'bank_deposit' && styles.paymentTypeButtonActive
                      ]}
                      onPress={() => setPaymentType('bank_deposit')}
                    >
                      <Text style={[
                        styles.paymentTypeText,
                        paymentType === 'bank_deposit' && styles.paymentTypeTextActive
                      ]}>📄 Bank Slip</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Dynamic Payment Fields */}
                {paymentType === 'cash' && renderCashPayment()}
                {paymentType === 'cheque' && renderChequePayment()}
                {paymentType === 'bank_deposit' && renderBankDepositPayment()}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Collect Payment</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentTypeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  paymentTypeButtonActive: {
    backgroundColor: '#667eea',
  },
  paymentTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  paymentTypeTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  chequeContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  chequeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  imageSection: {
    marginTop: 10,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#667eea',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  removeImageButton: {
    padding: 8,
    backgroundColor: '#ff4757',
    borderRadius: 6,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentCollectionModal;
