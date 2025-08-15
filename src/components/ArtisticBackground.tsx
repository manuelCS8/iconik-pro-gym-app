import React from 'react';
import { ImageBackground, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const ArtisticBackground: React.FC = () => {
  return (
    <ImageBackground
      source={require('../../assets/background_pattern.2.png')}
      style={styles.background}
      resizeMode="cover"
    />
  );
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});

export default ArtisticBackground; 