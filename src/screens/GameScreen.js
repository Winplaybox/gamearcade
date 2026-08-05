import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  StatusBar,
  TextInput,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as ScreenOrientation from 'expo-screen-orientation';
import AnimatedTouch from '../components/AnimatedTouch';
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
import { collection, addDoc, serverTimestamp, doc, getDoc } from '@firebase/firestore';
import { db } from '../config/firebase';

const getRatingLabel = (stars, t) => {
  switch (stars) {
    case 1: return t('rating_1') || 'Poor 😞';
    case 2: return t('rating_2') || 'Fair 🙂';
    case 3: return t('rating_3') || 'Good 😊';
    case 4: return t('rating_4') || 'Very Good! 😁';
    case 5: return t('rating_5') || 'Excellent! Loved it! 🔥';
    default: return '';
  }
};

export default function GameScreen({ route, navigation }) {
  const { showAlert } = useCustomAlert();
  // We might receive the full `game` object (normal navigation) or just `gameId` (deep linking)
  const [game, setGame] = useState(route.params.game || null);
  const deepLinkGameId = route.params.gameId;

  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(15);
  const [statusIndex, setStatusIndex] = useState(0);

  // Fullscreen Swipe Gesture Controls state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(false);
  const hideControlsTimerRef = useRef(null);

  // Menu & Modals State
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  // Rating State
  const [selectedStars, setSelectedStars] = useState(5);
  const [ratingReviewText, setRatingReviewText] = useState('');
  const [userExistingRating, setUserExistingRating] = useState(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [isFav, setIsFav] = useState(false);
  // Orientation: 'auto' | 'portrait' | 'landscape'
  const [orientation, setOrientation] = useState('auto');
  const webviewRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Stable Memoized WebView Source — prevents prop reference changes from reloading webview
  const webViewSource = useMemo(() => ({ uri: game?.gameUrl }), [game?.gameUrl]);

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
      // Always restore portrait + unlock when leaving GameScreen
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => { });
      StatusBar.setHidden(false);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [game]);

  // Deep Linking fetch logic
  useEffect(() => {
    if (!game && deepLinkGameId) {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'games', deepLinkGameId));
          if (snap.exists()) {
            setGame({ id: snap.id, ...snap.data() });
          } else {
            showAlert(t('error') || 'Not Found', t('game_not_found') || 'The requested game could not be found.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          }
        } catch (e) {
          showAlert(t('error') || 'Error', t('failed_load_game') || 'Failed to load game.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        }
      })();
    }
  }, [game, deepLinkGameId]);

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
    showBackNavInterstitial(() => navigation.goBack(), 'GameScreen', 'Exit Game');
  };

  const handleReload = () => {
    setMenuModalVisible(false);
    isInitialLoadRef.current = true;
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
    navigation.navigate('ReportIssue', { game });
  };

  // Cycle: auto → landscape → portrait → auto
  const handleRotate = async () => {
    setMenuModalVisible(false);
    try {
      if (orientation === 'auto') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setOrientation('landscape');
      } else if (orientation === 'landscape') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setOrientation('portrait');
      } else {
        await ScreenOrientation.unlockAsync();
        setOrientation('auto');
      }
    } catch (err) {
      console.warn('ScreenOrientation rotate error:', err);
    }
  };

  // Icon & label based on current orientation state
  const rotateIcon = orientation === 'landscape' ? 'phone-landscape-outline'
    : orientation === 'portrait' ? 'phone-portrait-outline'
    : 'phone-landscape-outline';
  const rotateLabel = orientation === 'landscape' ? (t('switch_portrait') || 'Switch to Portrait')
    : orientation === 'portrait' ? (t('auto_rotate') || 'Auto Rotate')
    : (t('switch_landscape') || 'Switch to Landscape');

  const handleOpenRatingModal = () => {
    setMenuModalVisible(false);
    setRatingModalVisible(true);
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
      showAlert(
        t('thank_you') || 'Thank You!',
        t('rating_submitted_msg') || 'Your rating has been submitted successfully.',
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

  // Single stable return — WebView stays in one position in the tree, never remounts.
  // Fullscreen is achieved by an absolutely-positioned transparent overlay covering the screen.
  return (
    <AppLayout
      title={game?.title || 'Game Player'}
      showBack={true}
      onBack={handleBack}
      rightAction={rightAction}
      scrollable={false}
    >
      {/* Game WebView Container — 100% constant position in React tree */}
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer, { backgroundColor: theme.bg }]}>
        <WebView
          ref={webviewRef}
          source={webViewSource}
          style={[styles.webview, { backgroundColor: theme.bg }]}
          onLoadStart={() => {
            if (isInitialLoadRef.current) {
              setLoading(true);
            }
          }}
          onLoadProgress={({ nativeEvent }) => {
            if (isInitialLoadRef.current) {
              const p = Math.max(15, nativeEvent.progress * 100);
              setLoadProgress(p);
            }
          }}
          onLoadEnd={() => {
            if (isInitialLoadRef.current) {
              setLoadProgress(100);
              setTimeout(() => {
                setLoading(false);
                isInitialLoadRef.current = false;
              }, 250);
            }
          }}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
        />

        {loading && (
          <GameLoadingOverlay
            game={game}
            loadProgress={loadProgress}
            statusIndex={statusIndex}
          />
        )}
      </View>

      {/* Fullscreen Overlay — covers entire screen (including AppLayout header) via absoluteFill.
          Only mounts/unmounts this lightweight View, never the WebView. */}
      {isFullscreen && (
        <View style={styles.fullscreenOverlay} {...panResponder.panHandlers}>
          {!showFullscreenControls && (
            <AnimatedTouch
              style={StyleSheet.absoluteFillObject}
              onPress={triggerShowFullscreenControls}
            />
          )}
          {showFullscreenControls && (
            <>
              <AnimatedTouch
                style={[
                  styles.floatingTopExitBtn,
                  { top: Math.max(insets.top + 14, 44) }
                ]}
                onPress={toggleFullscreen}
              >
                <SafeIcon name="arrow-back" size={20} color={theme.onPrimary} />
              </AnimatedTouch>
              <AnimatedTouch
                style={[
                  styles.floatingExitFullscreenBtn,
                  { bottom: Math.max(insets.bottom + 18, 36) }
                ]}
                onPress={toggleFullscreen}
              >
                <SafeIcon name="contract" size={20} color={theme.onPrimary} style={{ marginRight: 6 }} />
                <Text style={[styles.floatingExitText, { color: theme.onPrimary }]}>{t('exit_fullscreen')}</Text>
              </AnimatedTouch>
            </>
          )}
        </View>
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
                <AnimatedTouch
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
                </AnimatedTouch>

                {/* Rate / Update Rating */}
                <AnimatedTouch
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
                </AnimatedTouch>

                {/* Rotate / Orientation */}
                <AnimatedTouch
                  style={[styles.menuSheetRow, { borderBottomColor: theme.border }]}
                  onPress={handleRotate}
                >
                  <SafeIcon name={rotateIcon} size={20} color={theme.text} style={{ marginRight: 14 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuSheetLabel, { color: theme.text }]}>{rotateLabel}</Text>
                    <Text style={{ fontSize: 11, color: theme.subText, marginTop: 1 }}>
                      {t('current') || 'Current:'} {orientation === 'auto' ? (t('auto') || 'Auto') : orientation === 'landscape' ? (t('landscape') || 'Landscape') : (t('portrait') || 'Portrait')}
                    </Text>
                  </View>
                  {orientation !== 'auto' && (
                    <View style={{ backgroundColor: 'rgba(233,69,96,0.15)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, color: '#E94560', fontWeight: '700' }}>{t('locked')}</Text>
                    </View>
                  )}
                </AnimatedTouch>

                {/* Reload Game */}
                <AnimatedTouch
                  style={[styles.menuSheetRow, { borderBottomColor: theme.border }]}
                  onPress={handleReload}
                >
                  <SafeIcon name="refresh-outline" size={20} color={theme.text} style={{ marginRight: 14 }} />
                  <Text style={[styles.menuSheetLabel, { color: theme.text }]}>{t('reload_game')}</Text>
                </AnimatedTouch>

                {/* Report Problem */}
                <AnimatedTouch
                  style={styles.menuSheetRow}
                  onPress={handleOpenReportModal}
                >
                  <SafeIcon name="warning-outline" size={20} color="#E94560" style={{ marginRight: 14 }} />
                  <Text style={[styles.menuSheetLabel, { color: '#E94560' }]}>{t('report_problem')}</Text>
                </AnimatedTouch>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Rating Modal */}
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
                  <AnimatedTouch onPress={() => setRatingModalVisible(false)}>
                    <SafeIcon name="close" size={22} color={theme.subText} />
                  </AnimatedTouch>
                </View>
                <Text style={[styles.ratingGameTitle, { color: theme.text }]}>{game?.title}</Text>
                <Text style={[styles.reportSub, { color: theme.subText }]}>
                  {userExistingRating ? (t('edit_rating_sub') || 'Edit your score or review:') : (t('rate_game_sub') || 'How would you rate this game?')}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <AnimatedTouch
                      key={starNum}
                      onPress={() => setSelectedStars(starNum)}
                      style={{ padding: 6 }}
                    >
                      <SafeIcon
                        name={starNum <= selectedStars ? 'star' : 'star-outline'}
                        size={36}
                        color={starNum <= selectedStars ? '#FFC107' : theme.subText}
                      />
                    </AnimatedTouch>
                  ))}
                </View>
                <Text style={[styles.starRatingHint, { color: theme.primary }]}>
                  {getRatingLabel(selectedStars, t)}
                </Text>
                <TextInput
                  style={[styles.notesInput, { backgroundColor: theme.subBg, color: theme.text, borderColor: theme.border }]}
                  placeholder={t('write_review_placeholder')}
                  placeholderTextColor={theme.subText}
                  multiline
                  numberOfLines={2}
                  value={ratingReviewText}
                  onChangeText={setRatingReviewText}
                />
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

    </AppLayout>
  );
}

import styles from '../styles/GameScreen.styles.js';
import { useCustomAlert } from '../context/AlertContext';
