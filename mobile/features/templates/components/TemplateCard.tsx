import { parseUTCDate } from '@/features/shared/utils/dateUtils';
import { PRIMARY } from '@/features/shared/utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Template } from '../types/template';

interface TemplateCardProps {
  template: Template;
  onPress: (template: Template) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onPress }) => {
  const getTemplateIcon = (title: string) => {
    if (title.includes('SOAP')) return 'description';
    if (title.includes('SIRP')) return 'list-alt';
    if (title.includes('DAP')) return 'assignment';
    return 'article';
  };

  const getTemplateColor = (title: string) => {
    if (title.includes('SOAP')) return '#3B82F6';
    if (title.includes('SIRP')) return '#10B981';
    if (title.includes('DAP')) return '#F59E0B';
    return PRIMARY;
  };

  const truncatePrompt = (prompt: string, maxLength: number = 150) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(template)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getTemplateColor(template.title) }]}>
          <MaterialIcons 
            name={getTemplateIcon(template.title) as any} 
            size={24} 
            color="white" 
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.templateTitle}>{template.title}</Text>
          <View style={styles.languageBadge}>
            <Text style={styles.languageText}>{template.language.toUpperCase()}</Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={PRIMARY} />
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.promptText}>
          {truncatePrompt(template.prompt)}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <MaterialIcons name="schedule" size={16} color="#6B7280" />
          <Text style={styles.footerText}>
            Created {parseUTCDate(template.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.selectBadge}>
          <Text style={styles.selectText}>Select Template</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  languageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  languageText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardBody: {
    padding: 16,
  },
  promptText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  selectBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  selectText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
});

export default TemplateCard; 