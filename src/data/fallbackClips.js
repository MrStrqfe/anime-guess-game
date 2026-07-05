// The bundled clip library, used by default and whenever the online source
// is unavailable. Maps each video path (under public/) to its accepted
// answers; guesses are matched against `answers` case-insensitively.
export const fallbackClips = {
  "videos/anime1.mp4": {
    answers: ["Attack on Titan", "Shingeki no Kyojin"],
    quality: "720p",
  },
  "videos/anime2.mp4": {
    answers: ["Blue Box", "Ao no Hako"],
    quality: "720p",
  },
  "videos/anime3.mp4": {
    answers: ["Haikyuu", "Haikyuu!!", "Haikyuu!! To the Top"],
    quality: "480p",
  },
  "videos/anime4.mp4": {
    answers: ["Blue Lock"],
    quality: "480p",
  },
  "videos/anime5.mp4": {
    answers: ["Hell's Paradise", "Hell Paradise", "Jigokuraku"],
    quality: "480p",
  },
  "videos/anime6.mp4": {
    answers: ["Your Lie in April", "Shigatsu wa Kimi no Uso"],
    quality: "480p",
  },
  "videos/anime7.mp4": {
    answers: ["Kowloon Generic Romance"],
    quality: "480p",
  },
  "videos/anime8.mp4": {
    answers: [
      "Demon Slayer",
      "Demon Slayer: Kimetsu no Yaiba",
      "Demon Slayer: Entertainment district arc",
      "Kimetsu no Yaiba",
    ],
    quality: "480p",
  },
  "videos/anime9.mp4": {
    answers: ["Hunter x Hunter", "Hunter Hunter"],
    quality: "480p",
  },
  "videos/anime10.mp4": {
    answers: [
      "Sword Art Online",
      "Sword Art Online: Alicization",
      "Sword Art Online Alicization",
      "SAO",
    ],
    quality: "480p",
  },
  "videos/anime11.mp4": {
    answers: [
      "The Beginning After the End",
      "Saikyou no Ousama, Nidome no Jinsei wa Nani wo Suru?",
      "Saikyou no Ousama, Nidome no Jinsei wa Nani wo Suru",
    ],
    quality: "480p",
  },
  "videos/anime12.mp4": {
    answers: ["Kaiju No. 8", "Kaiju No 8", "Kaiju", "Kaijuu 8-gou"],
    quality: "480p",
  },
};
