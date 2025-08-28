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
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { LinearGradient } from 'react-native-linear-gradient';
import { customerDetailService, Document } from '../services/customerDetailService';
import PermissionService from '../services/permissionService';
import { check, PERMISSIONS } from 'react-native-permissions';



interface DocumentsModalProps {
  visible: boolean;
  onClose: () => void;
  customerId: string;
  onDocumentUploaded?: () => void;
}

const DocumentsModal: React.FC<DocumentsModalProps> = ({
  visible,
  onClose,
  customerId,
  onDocumentUploaded,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (visible && customerId) {
      loadDocuments();
    }
  }, [visible, customerId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await customerDetailService.getCustomerDocuments(customerId);
      setDocuments(response.documents);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
  };

  const getDocumentIcon = (type: string) => {
    const mimeType = type.toLowerCase();
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('text')) return '📄';
    return '📎';
  };



  const takePhoto = async () => {
    const permissionService = PermissionService.getInstance();
    try {
      // Check camera permission dynamically
      const cameraPermission = await check(PERMISSIONS.ANDROID.CAMERA);
      if (cameraPermission !== 'granted') {
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

    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    const permissionService = PermissionService.getInstance();
    try {
      // Check storage permission dynamically
      const storagePermission = await check(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      if (storagePermission !== 'granted') {
        Alert.alert('Permission Denied', 'Storage permission is required. Please grant permission in Settings.');
        permissionService.showPermissionSettingsAlert();
        return;
      }

    const options = {
      mediaType: 'photo' as const,
      quality: 0.8 as const,
      includeBase64: false,
      selectionLimit: 1,
      includeExtra: true,
    };

    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickDocumentFile = async () => {
    const permissionService = PermissionService.getInstance();
    try {
      // Check storage permission dynamically
      const storagePermission = await check(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      if (storagePermission !== 'granted') {
        Alert.alert('Permission Denied', 'Storage permission is required. Please grant permission in Settings.');
        permissionService.showPermissionSettingsAlert();
        return;
      }

    const options = {
      mediaType: 'mixed' as const,
      quality: 1 as const,
      includeBase64: false,
      selectionLimit: 1,
      // Add specific file types for better PDF support
      includeExtra: true,
    };

    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      Alert.alert(
        'Select Document',
        'Choose how you want to add a document',
        [
          {
            text: 'Camera',
            onPress: takePhoto,
          },
          {
            text: Platform.OS === 'android' ? 'Gallery' : 'Photo Library',
            onPress: pickImage,
          },
          {
            text: 'PDF/Documents',
            onPress: pickDocumentFile,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadDocument = async (file: any) => {
    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name,
      } as any);
      formData.append('customerId', customerId);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const response = await customerDetailService.uploadDocument(formData);
      Alert.alert('Success', `Document "${file.name}" uploaded successfully!`);
      setDescription('');
      await loadDocuments();
      onDocumentUploaded?.();
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerDetailService.deleteDocument(documentId);
              Alert.alert('Success', 'Document deleted successfully');
              await loadDocuments();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const openDocument = async (document: Document) => {
    try {
      // For now, show document details
      Alert.alert(
        'Document Details',
        `Name: ${document.originalName}\nType: ${document.fileType}\nSize: ${formatFileSize(document.fileSize)}\nUploaded: ${formatDate(document.createdAt)}\n${document.description ? `Description: ${document.description}` : ''}`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Download', onPress: () => {
            // TODO: Implement document download
            Alert.alert('Info', 'Document download will be implemented soon');
          }},
        ]
      );
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

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
            <View style={styles.documentsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Customer Documents</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.documentsList}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.loadingText}>Loading documents...</Text>
                  </View>
                ) : documents.length === 0 ? (
                  <View style={styles.noDocumentsContainer}>
                    <Text style={styles.noDocumentsIcon}>📁</Text>
                    <Text style={styles.noDocumentsText}>No documents uploaded yet</Text>
                    <Text style={styles.noDocumentsSubtext}>
                      Upload documents related to this customer
                    </Text>
                  </View>
                ) : (
                  documents.map((document) => (
                    <TouchableOpacity 
                      key={document.id} 
                      style={styles.documentItem}
                      onPress={() => openDocument(document)}
                    >
                      <View style={styles.documentIcon}>
                        <Text style={styles.documentIconText}>
                          {getDocumentIcon(document.fileType)}
                        </Text>
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{document.originalName}</Text>
                        <Text style={styles.documentMeta}>
                          {document.fileType.toUpperCase()} • {formatFileSize(document.fileSize)} • {formatDate(document.createdAt)}
                        </Text>
                        {document.description && (
                          <Text style={styles.documentDescription}>
                            {document.description}
                          </Text>
                        )}
                        <Text style={styles.documentUploader}>
                          Uploaded by {document.uploadedBy}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => deleteDocument(document.id)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              
              <View style={styles.uploadSection}>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Document description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity 
                  style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                  onPress={pickDocument}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Text style={styles.uploadButtonIcon}>📤</Text>
                      <Text style={styles.uploadButtonText}>Upload Document</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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
  documentsModal: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  documentsList: {
    flex: 1,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  noDocumentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDocumentsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDocumentsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noDocumentsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  documentDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontStyle: 'italic',
  },
  documentUploader: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
  },
  uploadSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
  },
  uploadButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  uploadButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default DocumentsModal;
