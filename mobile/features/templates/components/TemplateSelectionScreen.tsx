import { GradientHeader } from '@/features/shared/components';
import { PRIMARY } from '@/features/shared/utils/theme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTemplatesService } from '../api/templates.service';
import { Template } from '../types/template';
import { TemplateCard } from './TemplateCard';

interface TemplateSelectionScreenProps {
  onTemplateSelect: (template: Template) => void;
  showHeader?: boolean; // Add option to hide header when used in workflow
}

export const TemplateSelectionScreen: React.FC<TemplateSelectionScreenProps> = ({
  onTemplateSelect,
  showHeader = true,
}) => {
  const { useTemplates } = useTemplatesService();
  const { data: templates = [], isLoading, error, refetch } = useTemplates();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template => {
    const haystack = `${template.title}\n${template.prompt}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return haystack.includes(query);
  });

  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template);
  };

  const renderTemplate = ({ item }: { item: Template }) => (
    <TemplateCard template={item} onPress={handleTemplateSelect} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="article" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No matching templates' : 'No templates found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'No note templates are available at the moment'
        }
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <MaterialIcons name="error-outline" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorSubtitle}>
        Unable to load templates. Please try again.
      </Text>
    </View>
  );

  if (error && !templates.length) {
    return (
      <View style={styles.container}>
        {showHeader && <GradientHeader title="Select Template" onClose={() => {}} />}
        {renderError()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && <GradientHeader title="Select Template" onClose={() => {}} />}
      
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Note Templates</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a template format for your session notes
          </Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Results Count */}
        {searchQuery.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {isLoading && !templates.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading templates...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTemplates}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTemplate}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                colors={[PRIMARY]}
                tintColor={PRIMARY}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TemplateSelectionScreen; 