import axios from 'axios';
import { getApiUrl } from './config';
import { FeedbackData } from '../components/FeedbackModal';

export interface ProductFeedback extends FeedbackData {
  id?: string;
  productCode: string;
  productName: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedback?: ProductFeedback;
  error?: string;
}

export class FeedbackService {
  private static instance: FeedbackService;

  private constructor() {}

  public static getInstance(): FeedbackService {
    if (!FeedbackService.instance) {
      FeedbackService.instance = new FeedbackService();
    }
    return FeedbackService.instance;
  }

  /**
   * Submit product feedback
   */
  public async submitFeedback(
    productCode: string,
    productName: string,
    feedbackData: FeedbackData
  ): Promise<FeedbackResponse> {
    try {
      const payload: ProductFeedback = {
        ...feedbackData,
        productCode,
        productName,
        timestamp: new Date().toISOString(),
      };

      const fullApiUrl = getApiUrl('/feedback/submit');
      console.log('Submitting feedback to:', fullApiUrl);
      
      const response = await axios.post(fullApiUrl, payload);
      
      console.log('Feedback submitted successfully:', response.data);
      
      return {
        success: true,
        message: 'Feedback submitted successfully',
        feedback: response.data.feedback,
      };
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      
      return {
        success: false,
        message: 'Failed to submit feedback',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get feedback for a specific product
   */
  public async getProductFeedback(productCode: string): Promise<ProductFeedback[]> {
    try {
      const fullApiUrl = getApiUrl(`/feedback/product/${productCode}`);
      console.log('Fetching feedback for product:', productCode);
      
      const response = await axios.get(fullApiUrl);
      
      console.log('Product feedback fetched successfully:', response.data);
      
      return response.data.feedback || [];
    } catch (error: any) {
      console.error('Failed to fetch product feedback:', error);
      return [];
    }
  }

  /**
   * Get user's feedback history
   */
  public async getUserFeedbackHistory(userId: string): Promise<ProductFeedback[]> {
    try {
      const fullApiUrl = getApiUrl(`/feedback/user/${userId}`);
      console.log('Fetching user feedback history for:', userId);
      
      const response = await axios.get(fullApiUrl);
      
      console.log('User feedback history fetched successfully:', response.data);
      
      return response.data.feedback || [];
    } catch (error: any) {
      console.error('Failed to fetch user feedback history:', error);
      return [];
    }
  }

  /**
   * Update feedback status (admin function)
   */
  public async updateFeedbackStatus(
    feedbackId: string,
    status: 'approved' | 'rejected'
  ): Promise<FeedbackResponse> {
    try {
      const fullApiUrl = getApiUrl(`/feedback/${feedbackId}/status`);
      console.log('Updating feedback status:', feedbackId, status);
      
      const response = await axios.put(fullApiUrl, { status });
      
      console.log('Feedback status updated successfully:', response.data);
      
      return {
        success: true,
        message: 'Feedback status updated successfully',
        feedback: response.data.feedback,
      };
    } catch (error: any) {
      console.error('Failed to update feedback status:', error);
      
      return {
        success: false,
        message: 'Failed to update feedback status',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Delete feedback (admin function)
   */
  public async deleteFeedback(feedbackId: string): Promise<FeedbackResponse> {
    try {
      const fullApiUrl = getApiUrl(`/feedback/${feedbackId}`);
      console.log('Deleting feedback:', feedbackId);
      
      const response = await axios.delete(fullApiUrl);
      
      console.log('Feedback deleted successfully:', response.data);
      
      return {
        success: true,
        message: 'Feedback deleted successfully',
      };
    } catch (error: any) {
      console.error('Failed to delete feedback:', error);
      
      return {
        success: false,
        message: 'Failed to delete feedback',
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get feedback statistics for a product
   */
  public async getProductFeedbackStats(productCode: string): Promise<{
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    categoryDistribution: { [key: string]: number };
  }> {
    try {
      const fullApiUrl = getApiUrl(`/feedback/stats/${productCode}`);
      console.log('Fetching feedback stats for product:', productCode);
      
      const response = await axios.get(fullApiUrl);
      
      console.log('Feedback stats fetched successfully:', response.data);
      
      return response.data.stats || {
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: {},
        categoryDistribution: {},
      };
    } catch (error: any) {
      console.error('Failed to fetch feedback stats:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: {},
        categoryDistribution: {},
      };
    }
  }
}

// Export singleton instance
export const feedbackService = FeedbackService.getInstance();
