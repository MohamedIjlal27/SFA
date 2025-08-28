import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { createAchievementCardStyles } from '../utils/styles/AchievementCard.styles';

interface AchievementCardProps {
  title: string;
  percentage: string;
  value: string;
  monthlyTarget: string; // new prop
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  title,
  percentage,
  value,
  monthlyTarget, // new prop
}) => {
  const theme = useTheme();
  const styles = createAchievementCardStyles(theme);
  
  const isPositive = percentage.startsWith('+');
  const isNegative = percentage.startsWith('-');
  const gradientColors = [theme.colors.primary, theme.colors.secondary];

  return (
    <Card style={[styles.achievementCard, styles.shadow]} mode="contained">
      <LinearGradient colors={gradientColors} style={styles.gradientBg}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onPrimary }]}> {title} </Text>
          {percentage && (
            <View style={[
              styles.percentagePill,
              isPositive ? styles.positivePill : isNegative ? styles.negativePill : styles.neutralPill
            ]}>
              <View style={[
                styles.iconCircle,
                isPositive ? styles.positiveIcon : isNegative ? styles.negativeIcon : styles.neutralIcon
              ]}>
                {isPositive ? (
                  <TrendingUp size={16} color={theme.colors.onPrimary} />
                ) : isNegative ? (
                  <TrendingDown size={16} color={theme.colors.onPrimary} />
                ) : null}
              </View>
              <Text style={[styles.percentageText, { color: theme.colors.onPrimary }]}> {percentage} </Text>
            </View>
          )}
        </View>
        <Text variant="displaySmall" style={[styles.value, { color: theme.colors.onPrimary }]}> {value} </Text>
        {monthlyTarget && monthlyTarget !== 'N/A' && monthlyTarget !== '' && (
          <Text variant="bodySmall" style={{ color: theme.colors.onPrimary, opacity: 0.85, marginTop: -4 }}>
            Monthly Target: {monthlyTarget}
          </Text>
        )}
      </LinearGradient>
    </Card>
  );
};

export default AchievementCard; 