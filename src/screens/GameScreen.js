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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useTheme } from '../theme/ThemeContext';
import { showBackNavInterstitial } from '../ads/AdManager';
import { isGameFavorite, toggleFavoriteGame } from '../storage/favoritesStorage';
import { addRecentGame } from '../storage/recentGamesStorage';

export default function GameScreen({ route, navigation }) {
  const { game } = route.params;
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(10);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const webviewRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (game?.id) {
        const favState = await isGameFavorite(game.id);
        setIsFav(favState);
        await addRecentGame(game);
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

  const handleReportProblem = () => {
    setMenuModalVisible(false);
    Alert.alert(
      'Report Problem',
      'Thank you for bringing this to our attention. Our team will verify this game link.',
      [{ text: 'OK' }]
    );
  };

  const rightAction = (
    <TouchableOpacity
      onPress={() => setMenuModalVisible(true)}
      style={styles.headerBtn}
    >
      <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
    </TouchableOpacity>
  );

  return (
    <AppLayout
      title={game?.title || 'Game Player'}
      showBack={true}
      onBack={handleBack}
      rightAction={rightAction}
      scrollable={false}
    >
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
              Loading game... {loadProgress}%
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

        {/* Clean Menu Sheet Modal */}
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
                      {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.menuSheetRow, { borderBottomColor: theme.border }]}
                    onPress={handleReload}
                  >
                    <Ionicons name="refresh-outline" size={20} color={theme.text} style={{ marginRight: 14 }} />
                    <Text style={[styles.menuSheetLabel, { color: theme.text }]}>Reload Game</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuSheetRow}
                    onPress={handleReportProblem}
                  >
                    <Ionicons name="warning-outline" size={20} color="#E94560" style={{ marginRight: 14 }} />
                    <Text style={[styles.menuSheetLabel, { color: '#E94560' }]}>Report Problem</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  headerBtn: {
    padding: 6,
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
});
