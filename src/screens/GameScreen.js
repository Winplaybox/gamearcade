import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AppLayout from '../components/AppLayout';
import { useTheme } from '../theme/ThemeContext';
import { showBackNavInterstitial } from '../ads/AdManager';

export default function GameScreen({ route, navigation }) {
  const { game } = route.params;
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const webviewRef = useRef(null);

  const handleBack = () => {
    showBackNavInterstitial(() => navigation.goBack());
  };

  const handleReload = () => {
    webviewRef.current?.reload();
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    const muteJs = `
      (function() {
        try {
          var media = document.querySelectorAll('video, audio');
          for (var i = 0; i < media.length; i++) {
            media[i].muted = ${nextMute ? 'true' : 'false'};
          }
        } catch(e) {}
      })();
      true;
    `;
    webviewRef.current?.injectJavaScript(muteJs);
  };

  const rightAction = (
    <View style={styles.rightActions}>
      <TouchableOpacity onPress={handleToggleMute} style={styles.headerBtn}>
        <Ionicons name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'} size={20} color={theme.text} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleReload} style={styles.headerBtn}>
        <Ionicons name="refresh-outline" size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
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
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={theme.primary} size="large" />
            <Text style={[styles.loadingText, { color: theme.text }]}>Loading {game?.title}...</Text>
          </View>
        )}
        <WebView
          ref={webviewRef}
          source={{ uri: game?.url }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
        />
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    padding: 6,
    marginLeft: 6,
  },
});
