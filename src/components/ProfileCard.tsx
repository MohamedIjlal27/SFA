import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { LogOut, User, Clock } from 'lucide-react-native';
import { createProfileCardStyles } from '../utils/styles/ProfileCard.styles';
import { useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { selectLastSyncTime } from '../redux/syncSlice';

interface ProfileCardProps {
  userData: {
    exeId?: string;
    exeName?: string;
    role?: string;
  } | null;
  userAvatar: string | null;
  onLogout: () => void;
  // lastSyncTime?: string | null; // Remove this prop
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userData,
  userAvatar,
  onLogout,
  // lastSyncTime, // Remove this prop
}) => {
  const styles = createProfileCardStyles();
  const theme = useTheme();
  const lastSyncTime = useSelector(selectLastSyncTime);
  
  const formatName = (name?: string) => {
    if (!name) return '';
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <LinearGradient
      colors={(theme as any).gradient || [theme.colors.primary, theme.colors.secondary]}
      style={styles.profileCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.profileContent}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {userAvatar ? (
              <Image 
                source={{ uri: userAvatar }} 
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={24} color={theme.colors.primary} />
              </View>
            )}
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.profileDetails}>
            <Text style={styles.profileInitials}>{userData?.exeId || 'N/A'}</Text>
            <Text style={[styles.profileName, { color: theme.colors.onPrimary }]}>
              {formatName(userData?.exeName)}
            </Text>
            <Text style={[styles.profileRole, { color: theme.colors.onPrimary }]}>{userData?.role || 'Sales Executive'}</Text>
            
            <View style={styles.syncInfo}>
              <Clock size={12} color={theme.colors.onPrimary} />
              <Text style={[styles.lastSynced, { color: theme.colors.onPrimary, opacity: 0.8 }]}>Last synced {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={theme.colors.onPrimary} />
          <Text style={[styles.logoutText, { color: theme.colors.onPrimary }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default ProfileCard; 