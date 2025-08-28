import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Portal,
  Card,
  Text,
  TextInput,
  Button,
  IconButton,
  useTheme,
  Chip,
} from 'react-native-paper';

export interface FeedbackData {
  rating: number;
  comment: string;
  category: string;
}

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
  productName?: string;
  productCode?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onSubmit,
  productName,
  productCode,
}) => {
  const theme = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackCategories = [
    'Quality',
    'Price',
    'Availability',
    'Packaging',
    'Delivery',
    'Customer Service',
    'Other',
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting feedback.');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comment Required', 'Please provide a comment with at least 10 characters.');
      return;
    }

    if (!category) {
      Alert.alert('Category Required', 'Please select a feedback category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const feedbackData: FeedbackData = {
        rating,
        comment: comment.trim(),
        category,
      };

      await onSubmit(feedbackData);
      
      // Reset form
      setRating(0);
      setComment('');
      setCategory('');
      
      Alert.alert(
        'Feedback Submitted',
        'Thank you for your feedback! It has been submitted successfully.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (comment.trim() || rating > 0 || category) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setRating(0);
              setComment('');
              setCategory('');
              onClose();
            }
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <IconButton
          key={i}
          icon={i <= rating ? 'star' : 'star-outline'}
          size={32}
          iconColor={i <= rating ? '#FFD700' : '#ccc'}
          onPress={() => setRating(i)}
          style={styles.starButton}
        />
      );
    }
    return stars;
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Product Feedback</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={handleClose}
                style={styles.closeButton}
              />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Product Info */}
              {productName && (
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{productName}</Text>
                  {productCode && (
                    <Text style={styles.productCode}>Code: {productCode}</Text>
                  )}
                </View>
              )}

              {/* Rating Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rate this product</Text>
                <View style={styles.starsContainer}>
                  {renderStars()}
                </View>
                <Text style={[styles.ratingText, { color: rating > 0 ? theme.colors.primary : '#666' }]}>
                  {getRatingText()}
                </Text>
              </View>

              {/* Category Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Feedback Category</Text>
                <View style={styles.categoriesContainer}>
                  {feedbackCategories.map((cat) => (
                    <Chip
                      key={cat}
                      selected={category === cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.categoryChip,
                        category === cat && { backgroundColor: theme.colors.primary }
                      ]}
                      textStyle={[
                        styles.categoryChipText,
                        category === cat && { color: 'white' }
                      ]}
                    >
                      {cat}
                    </Chip>
                  ))}
                </View>
              </View>

              {/* Comment Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Feedback</Text>
                <TextInput
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  placeholder="Share your experience with this product... (minimum 10 characters)"
                  value={comment}
                  onChangeText={setComment}
                  style={styles.commentInput}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>
                  {comment.length}/500 characters
                </Text>
              </View>

              {/* Submit Button */}
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={isSubmitting || rating === 0 || comment.trim().length < 10 || !category}
                  loading={isSubmitting}
                  style={styles.submitButton}
                  labelStyle={styles.submitButtonText}
                >
                  Submit Feedback
                </Button>
              </View>
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    padding: 16,
  },
  productInfo: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starButton: {
    margin: 0,
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  categoryChipText: {
    fontSize: 14,
  },
  commentInput: {
    backgroundColor: 'white',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 16,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FeedbackModal;
