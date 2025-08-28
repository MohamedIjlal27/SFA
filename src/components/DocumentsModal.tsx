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
// DocumentPicker removed due to React Native 0.81.1 compatibility issues
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FileViewer from 'react-native-file-viewer';



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
  const [selectedFiles, setSelectedFiles] = useState<Array<{
    uri: string;
    type: string;
    name: string;
    size: number;
    id: string;
  }>>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editDescription, setEditDescription] = useState('');

  // Local storage key for documents
  const STORAGE_KEY = `@customer_documents_${customerId}`;

  // Local storage functions
  const saveDocumentsToStorage = async (docs: Document[]) => {
    try {
      const storageKey = STORAGE_KEY;
      const dataToSave = JSON.stringify(docs);
      await AsyncStorage.setItem(storageKey, dataToSave);
      console.log('💾 Documents saved to local storage:', docs.length);
      console.log('💾 Storage key:', storageKey);
      console.log('💾 Data saved:', dataToSave.substring(0, 200) + '...');
    } catch (error) {
      console.error('Error saving documents to storage:', error);
    }
  };

  const loadDocumentsFromStorage = async (): Promise<Document[]> => {
    try {
      const storageKey = STORAGE_KEY;
      console.log('📂 Loading from storage key:', storageKey);
      const stored = await AsyncStorage.getItem(storageKey);
      console.log('📂 Raw stored data:', stored ? stored.substring(0, 200) + '...' : 'null');
      if (stored) {
        const docs = JSON.parse(stored);
        console.log('📂 Loaded documents from storage:', docs.length);
        return docs;
      }
      return [];
    } catch (error) {
      console.error('Error loading documents from storage:', error);
      return [];
    }
  };

  useEffect(() => {
    if (visible && customerId) {
      loadDocuments();
    }
  }, [visible, customerId]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await loadDocumentsFromStorage();
      console.log('📚 Loaded documents:', docs.length);
      console.log('📚 Documents data:', JSON.stringify(docs, null, 2));
      console.log('📚 Documents array type:', Array.isArray(docs));
      console.log('📚 First document:', docs[0]);
      
      setDocuments(docs);
      
      // Force a re-render check
      setTimeout(() => {
        console.log('📚 State after setDocuments:', documents.length);
      }, 100);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents from local storage');
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
      // Check if we can add more files
      if (selectedFiles.length >= 10) {
        Alert.alert('Maximum Files Reached', 'You can only select up to 10 files. Please remove some files before adding more.');
        return;
      }

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

      const result = await launchCamera(options);
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFiles(prev => [...prev, {
          uri: file.uri || '',
          type: file.type || 'image/jpeg',
          name: file.fileName || `photo_${Date.now()}.jpg`,
          size: file.fileSize || 0,
          id: Date.now().toString(),
        }]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImage = async () => {
    const permissionService = PermissionService.getInstance();
    try {
      // Check if we can add more files
      if (selectedFiles.length >= 10) {
        Alert.alert('Maximum Files Reached', 'You can only select up to 10 files. Please remove some files before adding more.');
        return;
      }

      // Check storage permission dynamically
      const storagePermission = await check(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      if (storagePermission !== 'granted') {
        Alert.alert('Permission Denied', 'Storage permission is required. Please grant permission in Settings.');
        permissionService.showPermissionSettingsAlert();
        return;
      }

      const remainingSlots = 10 - selectedFiles.length;
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        includeBase64: false,
        selectionLimit: remainingSlots, // Allow remaining slots
        includeExtra: true,
      };

      const result = await launchImageLibrary(options);
      if (result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map(file => ({
          uri: file.uri || '',
          type: file.type || 'image/jpeg',
          name: file.fileName || `image_${Date.now()}.jpg`,
          size: file.fileSize || 0,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));
        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickDocumentFile = async () => {
    const permissionService = PermissionService.getInstance();
    try {
      // Check if we can add more files
      if (selectedFiles.length >= 10) {
        Alert.alert('Maximum Files Reached', 'You can only select up to 10 files. Please remove some files before adding more.');
        return;
      }

      // Check storage permission dynamically
      const storagePermission = await check(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      if (storagePermission !== 'granted') {
        Alert.alert('Permission Denied', 'Storage permission is required. Please grant permission in Settings.');
        permissionService.showPermissionSettingsAlert();
        return;
      }

      const remainingSlots = 10 - selectedFiles.length;
      const options = {
        mediaType: 'mixed' as const,
        quality: 0.8 as const,
        includeBase64: false,
        selectionLimit: remainingSlots, // Allow remaining slots
        includeExtra: true,
      };

      const result = await launchImageLibrary(options);
      if (result.assets && result.assets.length > 0) {
        const newFiles = result.assets.map(file => ({
          uri: file.uri || '',
          type: file.type || 'application/octet-stream',
          name: file.fileName || `document_${Date.now()}.pdf`,
          size: file.fileSize || 0,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));
        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      const alertOptions = [
        {
          text: 'Camera',
          onPress: takePhoto,
        },
        {
          text: Platform.OS === 'android' ? 'Gallery' : 'Photo Library',
          onPress: pickImage,
        },
        {
          text: 'Documents',
          onPress: pickDocumentFile,
        },
      ];

      // Add Clear All option if there are selected files
      if (selectedFiles.length > 0) {
        alertOptions.push({
          text: 'Clear All Files',
          onPress: async () => setSelectedFiles([]),
        });
      }

      alertOptions.push({
        text: 'Cancel',
        onPress: async () => {},
      });

      Alert.alert(
        'Select Files',
        `Choose how you want to add files${selectedFiles.length > 0 ? ` (${selectedFiles.length} selected)` : ''}`,
        alertOptions
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadDocument = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Error', 'No file selected');
      return;
    }

    if (!customerId || customerId.trim() === '') {
      Alert.alert('Error', 'Customer ID is required');
      return;
    }

    setIsUploading(true);
    try {
      console.log('📤 Uploading files to local storage:', selectedFiles.length);

      // Create document objects for local storage
      const newDocuments: Document[] = selectedFiles.map((file, index) => ({
        id: `local_${Date.now()}_${index}`,
        customerId: customerId,
        uploadedBy: 'Demo User',
        fileName: file.name,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: file.uri, // Store local URI
        description: description.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Get existing documents and add new ones
      const existingDocs = await loadDocumentsFromStorage();
      console.log('📂 Existing documents:', existingDocs.length);
      const updatedDocs = [...existingDocs, ...newDocuments];
      console.log('📂 Updated documents total:', updatedDocs.length);
      
      // Save to local storage
      await saveDocumentsToStorage(updatedDocs);
      
      console.log(`✅ Successfully saved ${newDocuments.length} document(s) to local storage`);
      
      Alert.alert(
        'Upload Successful', 
        `${newDocuments.length} document${newDocuments.length > 1 ? 's' : ''} saved to local storage!`
      );
      
      setDescription('');
      setSelectedFiles([]); // Clear the selected files
      await loadDocuments(); // Reload documents
      onDocumentUploaded?.();
    } catch (error: any) {
      console.error('Error saving documents:', error);
      Alert.alert('Error', 'Failed to save documents to local storage');
    } finally {
      setIsUploading(false);
    }
  };

  const updateDocument = async (documentId: string, newDescription: string) => {
    try {
      // Get existing documents
      const existingDocs = await loadDocumentsFromStorage();
      
      // Find and update the document
      const updatedDocs = existingDocs.map(doc => 
        doc.id === documentId 
          ? { ...doc, description: newDescription, updatedAt: new Date().toISOString() }
          : doc
      );
      
      // Save updated documents
      await saveDocumentsToStorage(updatedDocs);
      
      Alert.alert('Success', 'Document updated successfully');
      setEditingDocument(null);
      setEditDescription('');
      await loadDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      Alert.alert('Error', 'Failed to update document');
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
              // Get existing documents
              const existingDocs = await loadDocumentsFromStorage();
              
              // Remove the document
              const updatedDocs = existingDocs.filter(doc => doc.id !== documentId);
              
              // Save updated documents
              await saveDocumentsToStorage(updatedDocs);
              
              Alert.alert('Success', 'Document deleted successfully');
              await loadDocuments();
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document from local storage');
            }
          },
        },
      ]
    );
  };

  const openFileViewer = async (document: Document) => {
    try {
      console.log('📁 Opening file:', document.fileUrl);
      
      // Check if file exists
      if (!document.fileUrl) {
        Alert.alert('Error', 'File URL not found');
        return;
      }

      // Open file with FileViewer
      await FileViewer.open(document.fileUrl, {
        showOpenWithDialog: true,
        onDismiss: () => {
          console.log('File viewer dismissed');
        },
      });
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Unable to open this file type or file not found');
    }
  };

  const openDocument = async (document: Document) => {
    try {
      // Show comprehensive document details
      const details = [
        `📄 Name: ${document.originalName}`,
        `📋 Type: ${document.fileType.toUpperCase()}`,
        `📏 Size: ${formatFileSize(document.fileSize)}`,
        `📅 Uploaded: ${formatDate(document.createdAt)}`,
        `👤 Uploaded by: ${document.uploadedBy}`,
        `💾 Storage: Local Storage (Demo Mode)`,
        document.description ? `📝 Description: ${document.description}` : '',
        `🆔 Document ID: ${document.id}`,
      ].filter(Boolean).join('\n');

      Alert.alert(
        '📋 Document Review',
        details,
        [
          { text: 'Close', style: 'cancel' },
          { text: '📁 Open File', onPress: () => {
            openFileViewer(document);
          }},
          { text: '✏️ Edit', onPress: () => {
            setEditingDocument(document);
            setEditDescription(document.description || '');
          }},
          { text: '🗑️ Delete', style: 'destructive', onPress: () => {
            deleteDocument(document.id);
          }},
        ]
      );
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

    return (
    <>
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
                  <View style={styles.headerActions}>
                    <TouchableOpacity 
                      style={styles.debugButton}
                      onPress={async () => {
                        console.log('🔍 Debug: Current documents state:', documents.length);
                        console.log('🔍 Debug: Storage key:', STORAGE_KEY);
                        console.log('🔍 Debug: Customer ID:', customerId);
                        const stored = await AsyncStorage.getItem(STORAGE_KEY);
                        console.log('🔍 Debug: Raw storage data:', stored);
                        
                        // Create test documents if none exist
                        if (!stored || stored === '[]') {
                          console.log('🔍 Creating test documents...');
                          const testDocs: Document[] = [
                            {
                              id: 'test_1',
                              customerId: customerId,
                              uploadedBy: 'Test User',
                              fileName: 'test_document.pdf',
                              originalName: 'test_document.pdf',
                              fileType: 'application/pdf',
                              fileSize: 1024,
                              fileUrl: 'file://test.pdf',
                              description: 'Test document for debugging',
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            }
                          ];
                          await saveDocumentsToStorage(testDocs);
                          await loadDocuments();
                        } else {
                          await loadDocuments();
                        }
                      }}
                    >
                      <Text style={styles.debugButtonText}>🔍</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={onClose}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Documents Count */}
                <View style={styles.documentsCountContainer}>
                  <Text style={styles.documentsCountText}>
                    {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                  </Text>
                </View>
                
                {/* Documents Review Section */}
                <View style={styles.documentsSection}>
                  <Text style={styles.documentsSectionTitle}>
                    📋 Review Documents ({documents.length})
                  </Text>
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
                      <Text style={styles.debugText}>Debug: documents.length = {documents.length}</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.debugText}>Debug: Rendering {documents.length} documents</Text>
                      {documents.map((document, index) => (
                        <TouchableOpacity 
                          key={document.id} 
                          style={styles.documentItem}
                          onPress={() => openFileViewer(document)}
                          onLongPress={() => openDocument(document)}
                        >
                          <View style={styles.documentIcon}>
                            <Text style={styles.documentIconText}>
                              {getDocumentIcon(document.fileType)}
                            </Text>
                          </View>
                          <View style={styles.documentInfo}>
                            <Text style={styles.documentName} numberOfLines={1}>
                              {document.originalName}
                            </Text>
                            <Text style={styles.documentMeta}>
                              {document.fileType.toUpperCase()} • {formatFileSize(document.fileSize)} • {formatDate(document.createdAt)}
                            </Text>
                            {document.description && (
                              <Text style={styles.documentDescription} numberOfLines={2}>
                                📝 {document.description}
                              </Text>
                            )}
                            <Text style={styles.documentUploader}>
                              👤 {document.uploadedBy} • 💾 Local Storage
                            </Text>
                          </View>
                          <View style={styles.documentActions}>
                            <TouchableOpacity 
                              style={styles.viewButton}
                              onPress={() => openDocument(document)}
                            >
                              <Text style={styles.viewButtonText}>👁️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.deleteButton}
                              onPress={() => deleteDocument(document.id)}
                            >
                              <Text style={styles.deleteButtonText}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </ScrollView>
                
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadSectionTitle}>
                    Upload Files (Demo Mode) {selectedFiles.length > 0 ? `(${selectedFiles.length}/10)` : ''}
                  </Text>
                  
                  {/* File Selection Box */}
                  <View style={styles.fileSelectionBox}>
                    {selectedFiles.length === 0 ? (
                      <TouchableOpacity 
                        style={styles.fileDropZone}
                        onPress={pickDocument}
                      >
                        <Text style={styles.fileDropZoneIcon}>📁</Text>
                        <Text style={styles.fileDropZoneTitle}>Select Files (Demo)</Text>
                        <Text style={styles.fileDropZoneSubtitle}>
                          Tap to choose multiple images or documents (saved locally)
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.selectedFilesContainer}>
                        {selectedFiles.map((file, index) => (
                          <View key={file.id} style={styles.selectedFileItem}>
                            <View style={styles.selectedFileIcon}>
                              <Text style={styles.selectedFileIconText}>
                                {getDocumentIcon(file.type)}
                              </Text>
                            </View>
                            <View style={styles.selectedFileInfo}>
                              <Text style={styles.selectedFileName} numberOfLines={1}>
                                {file.name}
                              </Text>
                              <Text style={styles.selectedFileMeta}>
                                {formatFileSize(file.size)} • {file.type}
                              </Text>
                            </View>
                            <TouchableOpacity 
                              style={styles.removeFileButton}
                              onPress={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                            >
                              <Text style={styles.removeFileButtonText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                        
                        {/* Add More Files Button */}
                        {selectedFiles.length < 10 && (
                          <TouchableOpacity 
                            style={styles.addMoreFilesButton}
                            onPress={pickDocument}
                          >
                            <Text style={styles.addMoreFilesIcon}>➕</Text>
                            <Text style={styles.addMoreFilesText}>Add More Files</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Description Input */}
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Document description (optional)"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={2}
                  />

                  {/* Upload Button */}
                  <TouchableOpacity 
                    style={[
                      styles.uploadButton, 
                      (selectedFiles.length === 0 || isUploading) && styles.uploadButtonDisabled
                    ]}
                    onPress={selectedFiles.length > 0 ? uploadDocument : pickDocument}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.uploadButtonText}>Uploading...</Text>
                      </>
                    ) : selectedFiles.length > 0 ? (
                      <>
                        <Text style={styles.uploadButtonIcon}>📤</Text>
                        <Text style={styles.uploadButtonText}>Upload Documents</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.uploadButtonIcon}>📁</Text>
                        <Text style={styles.uploadButtonText}>Select Document</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Document Modal */}
      <Modal
        visible={editingDocument !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingDocument(null)}
      >
        <TouchableWithoutFeedback onPress={() => setEditingDocument(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.editModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>✏️ Edit Document</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setEditingDocument(null)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                {editingDocument && (
                  <View style={styles.editContent}>
                    <View style={styles.documentPreview}>
                      <View style={styles.documentIcon}>
                        <Text style={styles.documentIconText}>
                          {getDocumentIcon(editingDocument.fileType)}
                        </Text>
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{editingDocument.originalName}</Text>
                        <Text style={styles.documentMeta}>
                          {editingDocument.fileType.toUpperCase()} • {formatFileSize(editingDocument.fileSize)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.editLabel}>Description:</Text>
                    <TextInput
                      style={styles.editDescriptionInput}
                      placeholder="Enter document description..."
                      value={editDescription}
                      onChangeText={setEditDescription}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#999"
                    />
                    
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                          setEditingDocument(null);
                          setEditDescription('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={() => {
                          if (editingDocument) {
                            updateDocument(editingDocument.id, editDescription);
                          }
                        }}
                      >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 14,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
  },
  documentsCountContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  documentsCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  documentsSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  documentsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
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
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
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
  uploadSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  fileSelectionBox: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fileDropZone: {
    alignItems: 'center',
    paddingVertical: 30,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#C0C0C0',
    borderRadius: 8,
  },
  fileDropZoneIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  fileDropZoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  fileDropZoneSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  selectedFilesContainer: {
    width: '100%',
    marginTop: 10,
  },
  selectedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  selectedFileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#BBDEFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedFileIconText: {
    fontSize: 18,
  },
  selectedFileInfo: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  selectedFileMeta: {
    fontSize: 12,
    color: '#666',
  },
  removeFileButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeFileButtonText: {
    fontSize: 12,
    color: 'white',
  },
     addMoreFilesButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#E3F2FD',
     borderWidth: 2,
     borderColor: '#4A90E2',
     borderStyle: 'dashed',
     borderRadius: 8,
     paddingVertical: 16,
     marginTop: 12,
   },
  addMoreFilesIcon: {
    fontSize: 16,
    marginRight: 8,
  },
     addMoreFilesText: {
     color: '#4A90E2',
     fontWeight: 'bold',
     fontSize: 14,
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
  editModal: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignSelf: 'center',
  },
  editContent: {
    paddingTop: 16,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  editDescriptionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FA',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default DocumentsModal;
