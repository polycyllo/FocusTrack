export type ToneItem = { key: string; label: string; file?: any };

export const TONES: ToneItem[] = [
  {
    key: "bell",
    label: "Campana",
    file: require("../../../assets/sounds/bell.wav"),
  },
  /*,
  {
    key: "ding",
    label: "Ding",
    file: require("../../../assets/sounds/ding.mp3"),
  },
  {
    key: "chime",
    label: "Carillón",
    file: require("../../../assets/sounds/chime.mp3"),
  },
  {
    key: "digital",
    label: "Digital",
    file: require("../../../assets/sounds/digital.mp3"),
  },
  {
    key: "wood",
    label: "Madera",
    file: require("../../../assets/sounds/wood.mp3"),
  },*/
];
