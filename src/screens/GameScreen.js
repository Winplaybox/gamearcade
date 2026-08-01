import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Image,
  Alert,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import AppLayout from '../components/AppLayout';
import { useTranslation } from '../i18n/i18n';
import { useTheme } from '../theme/ThemeContext';
import { showBackNavInterstitial } from '../ads/AdManager';
import { isGameFavorite, toggleFavoriteGame } from '../storage/favoritesStorage';
import { addRecentGame, updateRecentGameSession } from '../storage/recentGamesStorage';
import { getUserRatings, saveGameRating } from '../storage/ratingsStorage';
import { collection, addDoc, serverTimestamp } from '@firebase/firestore';
import { db } from '../config/firebase';

const REPORT_CATEGORIES = [
  'Game Not Loading',
  'Blank / Black Screen',
  'Controls Not Working',
  'Other Technical Issue',
];

const RATING_LABELS = {
  1: 'Poor 😞',
  2: 'Fair 🙂',
  3: 'Good 😊',
  4: 'Very Good! 😁',
  5: 'Excellent! Loved it! 🔥',
};

export default function GameScreen({ route, navigation }) {
  const { game } = route.params;
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(10);

  // Menu & Modals State
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  // Report Form State
  const [selectedReportCategory, setSelectedReportCategory] = useState(REPORT_CATEGORIES[0]);
  const [reportNotes, setReportNotes] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Rating State
  const [selectedStars, setSelectedStars] = useState(5);
  const [ratingReviewText, setRatingReviewText] = useState('');
  const [userExistingRating, setUserExistingRating] = useState(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [isFav, setIsFav] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const webviewRef = useRef(null);

  // Track session start time and update duration on unmount
  const sessionStartTimeRef = useRef(Date.now());

  // Orientation Locking & Play Duration Setup
  useEffect(() => {
    sessionStartTimeRef.current = Date.now();

    const applyOrientation = async () => {
      const ori = game?.orientation?.toLowerCase();
      try {
        if (ori === 'portrait') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else if (ori === 'landscape') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.unlockAsync();
        }
      } catch (err) {
        console.warn('ScreenOrientation lock error:', err);
      }
    };

    applyOrientation();

    return () => {
      const elapsedMs = Date.now() - sessionStartTimeRef.current;
      if (game?.id && elapsedMs > 2000) {
        updateRecentGameSession(game.id, elapsedMs).catch(() => {});
      }
      ScreenOrientation.unlockAsync().catch(() => {});
      StatusBar.setHidden(false);
    };
  }, [game]);

  useEffect(() => {
    (async () => {
      if (game?.id) {
        const favState = await isGameFavorite(game.id);
        setIsFav(favState);
        await addRecentGame(game);

        const ratingsMap = await getUserRatings();
        if (ratingsMap[game.id]) {
          setUserExistingRating(ratingsMap[game.id].rating);
          setSelectedStars(ratingsMap[game.id].rating);
          if (ratingsMap[game.id].reviewText) {
            setRatingReviewText(ratingsMap[game.id].reviewText);
          }
        }
      }
    })();
  }, [game]);

  // Progress loader simulation
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleBack = () => {
    showBackNavInterstitial(() => navigation.goBack());
  };

  const handleReload = () => {
    setMenuModalVisible(false);
    setLoading(true);
    setLoadProgress(10);
    webviewRef.current?.reload();
  };

  const handleToggleFavorite = async () => {
    setMenuModalVisible(false);
    if (game) {
      const updated = await toggleFavoriteGame(game);
      setIsFav(updated.some((f) => f.id === game.id));
    }
  };

  const handleOpenReportModal = () => {
    setMenuModalVisible(false);
    setReportModalVisible(true);
  };

  const handleOpenRatingModal = () => {
    setMenuModalVisible(false);
    setRatingModalVisible(true);
  };

  const handleSubmitReport = async () => {
    if (!game?.id) return;
    setIsSubmittingReport(true);
    try {
      if (db) {
        await addDoc(collection(db, 'game_reports'), {
          gameId: game.id,
          gameTitle: game.title || 'Unknown',
          gameUrl: game.url || '',
          category: selectedReportCategory,
          notes: reportNotes.trim(),
          createdAt: serverTimestamp(),
          platform: 'android',
        });
      }
    } catch (e) {
      console.warn('Firestore report submit error:', e);
    } finally {
      setIsSubmittingReport(false);
      setReportModalVisible(false);
      setReportNotes('');
      Alert.alert(
        t('report_submitted_title'),
        t('report_submitted_msg'),
        [{ text: 'OK' }]
      );
    }
  };

  const handleSubmitRating = async () => {
    if (!game?.id) return;
    setIsSubmittingRating(true);
    try {
      await saveGameRating(game, selectedStars, ratingReviewText);
      setUserExistingRating(selectedStars);
    } catch (e) {
      console.warn('Rating submit error:', e);
    } finally {
      setIsSubmittingRating(false);
      setRatingModalVisible(false);
      Alert.alert(
        'Thank You!',
        t('rating_submitted_msg'),
        [{ text: 'OK' }]
      );
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      StatusBar.setHidden(next);
      return next;
    });
  };

  const rightAction = (
    <View style={styles.headerRightRow}>
      <TouchableOpacity onPress={toggleFullscreen} style={styles.headerBtn} activeOpacity={0.7}>
        <Ionicons name="expand-outline" size={20} color={theme.text} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMenuModalVisible(true)}
        style={[styles.headerBtn, { marginLeft: 8 }]}
        activeOpacity={0.7}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  const mainContent = (
    <View style={styles.container}>
      {/* Game Loading Overlay */}
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.bg }]}>
          {game?.iconUrl ? (
            <Image source={{ uri: game.iconUrl }} style={styles.loadingGameIcon} />
          ) : (
            <View style={[styles.loadingIconPlaceholder, { backgroundColor: theme.cardBg }]}>
              <Ionicons name="game-controller" size={40} color={theme.primary} />
            </View>
          )}

          <Text style={[styles.loadingTitle, { color: theme.text }]}>{game?.title}</Text>
          <Text style={[styles.loadingCategory, { color: theme.subText }]}>{game?.category || 'Arcade'}</Text>

          {/* Glowing Loading Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: theme.subBg }]}>
            <View style={[styles.progressBarFill, { width: `${loadProgress}%`, backgroundColor: theme.primary }]} />
          </View>

          <Text style={[styles.loadingStatusText, { color: theme.subText }]}>
            {t('loading')} {loadProgress}%
          </Text>
        </View>
      )}

      <WebView
        ref={webviewRef}
        source={{ uri: game?.url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => {
          setLoadProgress(100);
          setLoading(false);
        }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />

      {/* Floating Exit Fullscreen Button in Fullscreen Mode */}
      {isFullscreen && (
        <TouchableOpacity
          style={styles.floatingExitFullscreenBtn}
          onPress={toggleFullscreen}
          activeOpacity={0.75}
        >
          <Ionicons name="contract" size={22} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Menu Sheet Modal */}
      <Modal
        visible={menuModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menuSheet, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                {/* Add to Favorites */}
                <TouchableOpacity
                  style={[styles.menuSheetRow, { borderBottomColor: theme.border }]}
                  onPress={handleToggleFavorite}
                >
                  <Ionicons
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFav ? '#E94560' : theme.text}
                    style={{ marginRight: 14 }}
                  />
                  <Text style={[styles.menuSheetLabel, { color: theme.text }]}>
                    {isFav ? t('remove_from_favorites') : t('add_to_favorites')}
                  </Text>
                </TouchableOpacity>

                {/* Rate / Update Rating Option */}
                <TouchableOpacity
                  style={[styles.menuSheetRow, { borderBottomColor: theme.border }]}
                  onPress={handleOpenRatingModal}
                >
                  <Ionicons
                    name={userExistingRating ? 'star' : 'star-outline'}
                    size={20}
                    color="#FFC107"
                    style={{ marginRight: 14 }}
                  />
                  <Text style={[styles.menuSheetLabel, { color: theme.text }]}>
                    {userExistingRating ? `${t('your_rating')}: ★ ${userExistingRating}` : t('rate_game')}
                  </Text>
                </TouchableOpacity>

                {/* Reload Game */}
                <TouchableOpacity
                  style={[styles.menuSheetRow, { borderBottomColor: theme.border }]}
                  onPress={handleReload}
                >
                  <Ionicons name="refresh-outline" size={20} color={theme.text} style={{ marginRight: 14 }} />
                  <Text style={[styles.menuSheetLabel, { color: theme.text }]}>{t('reload_game')}</Text>
                </TouchableOpacity>

                {/* Report Problem */}
                <TouchableOpacity
                  style={styles.menuSheetRow}
                  onPress={handleOpenReportModal}
                >
                  <Ionicons name="warning-outline" size={20} color="#E94560" style={{ marginRight: 14 }} />
                  <Text style={[styles.menuSheetLabel, { color: '#E94560' }]}>{t('report_problem')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Interactive 5-Star Game Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setRatingModalVisible(false)}>
          <View style={styles.modalCenterOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.ratingCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.reportHeader}>
                  <Text style={[styles.reportTitle, { color: theme.text }]}>
                    {userExistingRating ? t('update_rating_title') : t('rate_game_title')}
                  </Text>
                  <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                    <Ionicons name="close" size={22} color={theme.subText} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.ratingGameTitle, { color: theme.text }]}>{game?.title}</Text>
                <Text style={[styles.reportSub, { color: theme.subText }]}>
                  {userExistingRating ? 'Edit your score or review:' : 'How would you rate this game?'}
                </Text>

                {/* Interactive 5-Star Row */}
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <TouchableOpacity
                      key={starNum}
                      onPress={() => setSelectedStars(starNum)}
                      activeOpacity={0.7}
                      style={{ padding: 6 }}
                    >
                      <Ionicons
                        name={starNum <= selectedStars ? 'star' : 'star-outline'}
                        size={36}
                        color={starNum <= selectedStars ? '#FFC107' : theme.subText}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.starRatingHint, { color: theme.primary }]}>
                  {RATING_LABELS[selectedStars]}
                </Text>

                {/* Review Text Input */}
                <TextInput
                  style={[styles.notesInput, { backgroundColor: theme.subBg, color: theme.text, borderColor: theme.border }]}
                  placeholder={t('write_review_placeholder')}
                  placeholderTextColor={theme.subText}
                  multiline
                  numberOfLines={2}
                  value={ratingReviewText}
                  onChangeText={setRatingReviewText}
                />

                {/* Submit Action Button */}
                <TouchableOpacity
                  style={[styles.submitReportBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSubmitRating}
                  disabled={isSubmittingRating}
                  activeOpacity={0.85}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitReportBtnText}>
                      {userExistingRating ? t('update_rating_title') : t('submit_rating')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Functional Interactive Report Problem Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setReportModalVisible(false)}>
          <View style={styles.modalCenterOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.reportCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.reportHeader}>
                  <Text style={[styles.reportTitle, { color: theme.text }]}>{t('report_a_problem')}</Text>
                  <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                    <Ionicons name="close" size={22} color={theme.subText} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.reportSub, { color: theme.subText }]}>
                  {t('report_issue_with')} "{game?.title}":
                </Text>

                {/* Category Radio Pills */}
                {REPORT_CATEGORIES.map((cat) => {
                  const isSelected = cat === selectedReportCategory;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.radioRow,
                        {
                          backgroundColor: isSelected ? 'rgba(233,69,96,0.12)' : theme.subBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setSelectedReportCategory(cat)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? theme.primary : theme.subText}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.radioLabel, { color: isSelected ? theme.text : theme.subText }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Notes Input */}
                <TextInput
                  style={[styles.notesInput, { backgroundColor: theme.subBg, color: theme.text, borderColor: theme.border }]}
                  placeholder={t('describe_issue_placeholder')}
                  placeholderTextColor={theme.subText}
                  multiline
                  numberOfLines={3}
                  value={reportNotes}
                  onChangeText={setReportNotes}
                />

                {/* Submit Action Button */}
                <TouchableOpacity
                  style={[styles.submitReportBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSubmitReport}
                  disabled={isSubmittingReport}
                  activeOpacity={0.85}
                >
                  {isSubmittingReport ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitReportBtnText}>{t('submit_report')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );

  if (isFullscreen) {
    return <View style={styles.fullscreenRoot}>{mainContent}</View>;
  }

  return (
    <AppLayout
      title={game?.title || 'Game Player'}
      showBack={true}
      onBack={handleBack}
      rightAction={rightAction}
      scrollable={false}
    >
      {mainContent}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  fullscreenRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 32,
  },
  loadingGameIcon: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 16,
  },
  loadingIconPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  loadingCategory: {
    fontSize: 13,
    marginBottom: 24,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  loadingStatusText: {
    fontSize: 12,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    padding: 6,
  },
  floatingExitFullscreenBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: 28,
  },
  menuSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  menuSheetLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalCenterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  ratingCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  ratingGameTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  starRatingHint: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  reportHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  reportSub: {
    fontSize: 13,
    marginBottom: 14,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesInput: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    textAlignVertical: 'top',
    marginTop: 6,
    marginBottom: 14,
  },
  submitReportBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReportBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
