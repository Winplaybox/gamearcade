import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  StatusBar,
  TextInput,
  PanResponder,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import AppLayout from '../components/AppLayout';
import SafeIcon from '../components/SafeIcon';
import GameLoadingOverlay from '../components/ui/GameLoadingOverlay';
import PrimaryButton from '../components/ui/PrimaryButton';
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
  const [loadProgress, setLoadProgress] = useState(15);
  const [statusIndex, setStatusIndex] = useState(0);

  // Fullscreen Swipe Gesture Controls state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(false);
  const hideControlsTimerRef = useRef(null);

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
  const webviewRef = useRef(null);

  // Track session start time and update duration on unmount
  const sessionStartTimeRef = useRef(Date.now());

  // Reveal controls for 3.5s when user swipes or taps in fullscreen
  const triggerShowFullscreenControls = () => {
    setShowFullscreenControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowFullscreenControls(false);
    }, 3500);
  };

  // Create PanResponder to catch swipe gestures in fullscreen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isFullscreen,
      onMoveShouldSetPanResponder: () => isFullscreen,
      onPanResponderGrant: () => {
        triggerShowFullscreenControls();
      },
      onPanResponderMove: () => {
        triggerShowFullscreenControls();
      },
    })
  ).current;

  // Orientation Setup: Unlock orientation by default so user can rotate device freely
  useEffect(() => {
    sessionStartTimeRef.current = Date.now();

    const applyOrientation = async () => {
      try {
        // Unlock orientation so user turns device freely
        await ScreenOrientation.unlockAsync();
      } catch (err) {
        console.warn('ScreenOrientation unlock error:', err);
      }
    };

    applyOrientation();

    return () => {
      const elapsedMs = Date.now() - sessionStartTimeRef.current;
      if (game?.id && elapsedMs > 2000) {
        updateRecentGameSession(game.id, elapsedMs).catch(() => { });
      }
      ScreenOrientation.unlockAsync().catch(() => { });
      StatusBar.setHidden(false);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
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

  // Rotate loading status strings every 2.5 seconds when loading
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setStatusIndex((prev) => prev + 1);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleBack = () => {
    showBackNavInterstitial(() => navigation.goBack());
  };

  const handleReload = () => {
    setMenuModalVisible(false);
    setLoading(true);
    setLoadProgress(15);
    setStatusIndex(0);
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
      if (next) {
        triggerShowFullscreenControls();
      } else {
        setShowFullscreenControls(false);
        if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
      }
      return next;
    });
  };

  const rightAction = (
    <View style={styles.headerRightRow}>
      <TouchableOpacity onPress={toggleFullscreen} style={styles.headerBtn} activeOpacity={0.7}>
        <SafeIcon name="expand-outline" size={20} color={theme.text} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setMenuModalVisible(true)}
        style={[styles.headerBtn, { marginLeft: 8 }]}
        activeOpacity={0.7}
      >
        <SafeIcon name="ellipsis-vertical" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  const mainContent = (
    <View style={styles.container} {...(isFullscreen ? panResponder.panHandlers : {})}>
      {/* Modular Full-bleed Game Loading Overlay */}
      {loading && (
        <GameLoadingOverlay
          game={game}
          loadProgress={loadProgress}
          statusIndex={statusIndex}
        />
      )}

      {/* Real Game WebView */}
      <WebView
        ref={webviewRef}
        source={{ uri: game?.url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadProgress={({ nativeEvent }) => {
          const p = Math.max(15, nativeEvent.progress * 100);
          setLoadProgress(p);
        }}
        onLoadEnd={() => {
          setLoadProgress(100);
          setTimeout(() => setLoading(false), 250);
        }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />

      {/* Fullscreen Touch Area to trigger reveal on tap/swipe anywhere */}
      {isFullscreen && !showFullscreenControls && (
        <TouchableOpacity
          style={styles.fullscreenGestureOverlay}
          onPress={triggerShowFullscreenControls}
          activeOpacity={1}
        />
      )}

      {/* Auto-Hiding Controls in Fullscreen Mode */}
      {isFullscreen && showFullscreenControls && (
        <>
          {/* Top Glass Exit Back Button */}
          <TouchableOpacity
            style={styles.floatingTopExitBtn}
            onPress={toggleFullscreen}
            activeOpacity={0.75}
          >
            <SafeIcon name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* Bottom Floating Exit Fullscreen Button */}
          <TouchableOpacity
            style={styles.floatingExitFullscreenBtn}
            onPress={toggleFullscreen}
            activeOpacity={0.75}
          >
            <SafeIcon name="contract" size={20} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.floatingExitText}>{t('exit_fullscreen')}</Text>
          </TouchableOpacity>
        </>
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
                  <SafeIcon
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
                  <SafeIcon
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
                  <SafeIcon name="refresh-outline" size={20} color={theme.text} style={{ marginRight: 14 }} />
                  <Text style={[styles.menuSheetLabel, { color: theme.text }]}>{t('reload_game')}</Text>
                </TouchableOpacity>

                {/* Report Problem */}
                <TouchableOpacity
                  style={styles.menuSheetRow}
                  onPress={handleOpenReportModal}
                >
                  <SafeIcon name="warning-outline" size={20} color="#E94560" style={{ marginRight: 14 }} />
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
                    <SafeIcon name="close" size={22} color={theme.subText} />
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
                      <SafeIcon
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

                {/* Modular Primary Submit Action Button */}
                <PrimaryButton
                  title={userExistingRating ? t('update_rating_title') : t('submit_rating')}
                  onPress={handleSubmitRating}
                  loading={isSubmittingRating}
                  height={46}
                  borderRadius={14}
                />
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
                    <SafeIcon name="close" size={22} color={theme.subText} />
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
                      <SafeIcon
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

                {/* Modular Primary Submit Action Button */}
                <PrimaryButton
                  title={t('submit_report')}
                  onPress={handleSubmitReport}
                  loading={isSubmittingReport}
                  height={46}
                  borderRadius={14}
                />
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
      rightAction={loadProgress ? null : rightAction}
      scrollable={false}
    >
      {mainContent}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  fullscreenRoot: {
    flex: 1,
    backgroundColor: '#1D1011',
  },
  container: {
    flex: 1,
    backgroundColor: '#1D1011',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1D1011',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    padding: 6,
  },
  fullscreenGestureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 90,
  },
  floatingTopExitBtn: {
    position: 'absolute',
    top: 24,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingExitFullscreenBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  floatingExitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
});
