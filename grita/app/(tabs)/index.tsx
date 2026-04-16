import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity, Text } from 'react-native';
import { Audio } from 'expo-av';

export default function SoundVisualizer() {
  const [recording, setRecording] = useState(null);
  // Animación para el tamaño de un objeto en pantalla
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      // Limpieza al cerrar la app
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  async function startMonitoring() {
    try {
      // 1. Pedir permiso
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      // 2. Iniciar "grabación" (solo para obtener los niveles de audio)
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      recording.setProgressUpdateInterval(50); // Actualización rápida para respuesta visual inmediata

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          // Normalizamos el valor: de decibelios (-160 a 0) a una escala de 1 a 4 para el tamaño
          const power = Math.max(0, (status.metering + 160) / 160); 
          const targetScale = 1 + (power * 3); // Crece hasta 4 veces su tamaño

          Animated.spring(scaleAnim, {
            toValue: targetScale,
            friction: 3,
            useNativeDriver: true,
          }).start();
        }
      });
    } catch (err) {
      console.error("Error accediendo al micro:", err);
    }
  }

  async function stopMonitoring() {
    setRecording(null);
    await recording.stopAndUnloadAsync();
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <View style={styles.container}>
      {/* El objeto que reacciona al sonido */}
      <Animated.View 
        style={[
          styles.circle, 
          { transform: [{ scale: scaleAnim }] }
        ]} 
      />

      <TouchableOpacity 
        onPress={recording ? stopMonitoring : startMonitoring}
        style={styles.button}
      >
        <Text style={{color: 'white'}}>{recording ? 'Detener' : 'Escuchar Sonido'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00FFCC',
    shadowColor: '#00FFCC',
    shadowBlur: 20,
    elevation: 10,
  },
  button: {
    position: 'absolute',
    bottom: 50,
    padding: 20,
    backgroundColor: '#333',
    borderRadius: 10,
  }
});