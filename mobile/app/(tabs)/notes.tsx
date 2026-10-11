import { useNotesService } from '@/features/quick-notes/api/notes.service';
import { Note } from '@/features/quick-notes/types/note';
import { DateFilterSheet, DateFilterType, DateRange } from '@/features/shared/components/DateFilterSheet';
import { formatDate, formatDateAsTitle, formatDuration, parseUTCDate } from '@/features/shared/utils/dateUtils';
import { PRIMARY } from '@/features/shared/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



const truncateText = (text: string, maxLength: number = 80): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

const NoteCard: React.FC<{ note: Note; onPress: () => void }> = ({ note, onPress }) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Create gradient colors based on thumbnail color
  const baseColor = note.thumbnailColor || PRIMARY;
  const gradientColors: [string, string] = [baseColor, `${baseColor}80`]; // Add transparency to second color

  return (
    <Animated.View style={[styles.noteCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.noteCardContent}>
          <LinearGradient
            colors={gradientColors}
            style={styles.thumbnail}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="mic" size={24} color="#fff" />
          </LinearGradient>
          
          <View style={styles.noteInfo}>
            <Text style={styles.noteTitle} numberOfLines={1}>
              {formatDateAsTitle(note.createdAt)}
            </Text>
            <Text style={styles.noteDescription} numberOfLines={2}>
              {truncateText(note.transcript)}
            </Text>
            <View style={styles.noteMeta}>
              <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
              {note.duration && (
                <Text style={styles.noteDuration}>{formatDuration(note.duration)}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.noteActions}>
            {note.isProcessing ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotesScreen() {
  const { useNotes } = useNotesService();
  const { data: notes = [], isLoading, error, refetch } = useNotes();
  
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [currentRange, setCurrentRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    label: 'All time'
  });
  
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const bottomSheetSnapPoints = useMemo(() => ['65%'], []);

  // Client-side filtering for both search and date
  const filteredNotes = useMemo(() => {
    let filtered = notes; // Remove search filtering since search field is hidden

    // Apply date filtering
    if (currentRange.startDate && currentRange.endDate) {
      filtered = filtered.filter(note => {
        const noteDate = parseUTCDate(note.createdAt);
        const startDate = new Date(currentRange.startDate!);
        const endDate = new Date(currentRange.endDate!);
        
        // Set time to start of day for start date and end of day for end date
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        return noteDate >= startDate && noteDate <= endDate;
      });
    }

    return filtered;
  }, [notes, currentRange]); // Remove searchQuery from dependencies

  const handleNotePress = (note: Note) => {
    router.push({
      pathname: '/(primary)/note-player' as any,
      params: { 
        noteId: note.id.toString(),
        noteData: JSON.stringify(note)
      }
    });
  };

  const openDateFilter = () => bottomSheetModalRef.current?.present();
  const closeDateFilter = () => bottomSheetModalRef.current?.dismiss();

  const handleApplyDateFilter = (filterType: DateFilterType, range: DateRange) => {
    setDateFilter(filterType);
    setCurrentRange(range);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="mic-outline" size={64} color="#e5e7eb" />
      <Text style={styles.emptyTitle}>
        {dateFilter === 'all' ? 'No Notes Yet' : 'No notes in this range'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {dateFilter === 'all' 
          ? 'Start recording your first note to see it here'
          : 'Try a different date range or clear the filter'
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[PRIMARY, '#0f423f']}
        style={styles.headerGradient}
      >
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Notes</Text>
            <Text style={styles.headerSubtitle}>
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerIconButton} onPress={openDateFilter} activeOpacity={0.8}>
            <Ionicons name="filter" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerChipsRow}>
          <View style={styles.filterChip}>
            <Ionicons name="calendar" size={14} color="#e5e7eb" />
            <Text style={styles.filterChipText}>{currentRange.label}</Text>
            {dateFilter !== 'all' && (
              <TouchableOpacity onPress={() => {
                setDateFilter('all');
                setCurrentRange({ startDate: null, endDate: null, label: 'All time' });
              }} style={styles.clearChipButton}>
                <Ionicons name="close" size={14} color="#e5e7eb" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
      
      {/* Search field hidden as requested */}
      {/* <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View> */}
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>Unable to load your notes</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => handleNotePress(item)} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={filteredNotes.length === 0 ? styles.listContentEmpty : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={PRIMARY}
          />
        }
      />

      {/* Date Filter Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={bottomSheetSnapPoints}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        enablePanDownToClose
      >
        <DateFilterSheet
          isVisible={true}
          onClose={closeDateFilter}
          onApplyFilter={handleApplyDateFilter}
          currentFilter={dateFilter}
          currentRange={currentRange}
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#f8fafc',
    paddingBottom: 20,
  },
  headerGradient: {
    padding: 24,
    paddingTop: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e6fffa',
    opacity: 0.8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerChipsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff1A',
    gap: 6,
  },
  filterChipText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '500',
  },
  clearChipButton: {
    marginLeft: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },

  noteCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noteCardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  noteInfo: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  noteDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  noteDuration: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  noteActions: {
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 