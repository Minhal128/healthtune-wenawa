import { PRIMARY } from '@/features/shared/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface GradientHeaderProps {
  title: string;
  onClose: () => void;
  rightAction?: React.ReactNode;
  statusBarStyle?: 'light-content' | 'dark-content';
  colors?: string[];
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  onClose,
  rightAction,
  statusBarStyle = 'light-content',
  colors = [PRIMARY, '#0f423f'],
}) => {
  return (
    <>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors[0]} />
      <LinearGradient colors={colors as any} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerButton}>
            {rightAction}
          </View>
        </View>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
}); 