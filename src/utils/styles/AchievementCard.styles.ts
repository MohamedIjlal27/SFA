import { StyleSheet } from 'react-native';

export const createAchievementCardStyles = (theme: any) => StyleSheet.create({
  achievementCard: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 160,
    marginBottom: 8,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 8,
  },
  gradientBg: {
    flex: 1,
    padding: 22,
    borderRadius: 20,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    marginRight: 8,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  percentagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  positivePill: {
    backgroundColor: theme.colors.primary,
  },
  negativePill: {
    backgroundColor: theme.colors.error,
  },
  neutralPill: {
    backgroundColor: theme.colors.secondary,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  positiveIcon: {
    backgroundColor: theme.colors.primary,
  },
  negativeIcon: {
    backgroundColor: theme.colors.error,
  },
  neutralIcon: {
    backgroundColor: theme.colors.secondary,
  },
  percentageText: {
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  value: {
    fontWeight: 'bold',
    fontSize: 36,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  // Add a subtle press effect
  cardPressable: {
    opacity: 0.95,
  },
}); 