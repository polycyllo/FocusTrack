import { Audio } from "expo-av";

let hasConfiguredAudio = false;

async function ensureAudioMode() {
  if (hasConfiguredAudio) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.warn("Failed to configure audio mode", error);
  } finally {
    hasConfiguredAudio = true;
  }
}

export async function playBell() {
  await ensureAudioMode();

  const { sound } = await Audio.Sound.createAsync(
    require("@/assets/sounds/bell.wav"),
    { volume: 0.65 }
  );

  sound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded || status.didJustFinish) {
      sound.unloadAsync().catch(() => {});
    }
  });

  await sound.playAsync();
}

