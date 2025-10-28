import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

let hasConfiguredAudio = false;

async function ensureAudioMode() {
  if (hasConfiguredAudio) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
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
    if (!status.isLoaded || (status as any).didJustFinish) {
      sound.unloadAsync().catch(() => {});
    }
  });

  await sound.playAsync();
}
