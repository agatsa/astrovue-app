import { BASE_URL } from "../config/constants";
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image } from 'react-native';

export default function SocialConnectScreen({ navigation }) {
  const [consentVisible, setConsentVisible] = useState(false);
  const [platformToLink, setPlatformToLink] = useState('');

  const handleConnectPress = (platform) => {
    setPlatformToLink(platform);
    setConsentVisible(true);
  };

  const confirmConsent = () => {
    setConsentVisible(false);
    // Proceed to OAuth or Upload flow
    if (platformToLink === 'manual') {
      navigation.navigate('ManualUpload');
    } else {
      navigation.navigate('OAuthFlow', { platform: platformToLink });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔗 Connect Your Socials</Text>

      <TouchableOpacity style={styles.button} onPress={() => handleConnectPress('instagram')}>
        <Text style={styles.btnText}>Connect Instagram</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleConnectPress('twitter')}>
        <Text style={styles.btnText}>Connect Twitter (X)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleConnectPress('facebook')}>
        <Text style={styles.btnText}>Connect Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.manualButton} onPress={() => handleConnectPress('manual')}>
        <Text style={styles.btnText}>📤 Upload Posts Manually</Text>
      </TouchableOpacity>

      {/* Consent Modal */}
      <Modal visible={consentVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Consent Required</Text>
            <Text style={styles.modalText}>
              AstroVue will access only your public posts, stories, and hashtags to analyze planetary energy and mood. No private data is accessed or stored.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={confirmConsent}>
                <Text style={styles.confirm}>Allow</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConsentVisible(false)}>
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  button: {
    backgroundColor: '#3949ab',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  manualButton: {
    backgroundColor: '#6a1b9a',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
  },
  btnText: { color: 'white', textAlign: 'center', fontSize: 16 },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 16, color: '#444' },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  confirm: { color: 'green', fontSize: 16 },
  cancel: { color: 'red', fontSize: 16 },
});
