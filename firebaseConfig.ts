// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// const firebaseConfig = {
//   apiKey: 'AIzaSyDfwBflDOUPRECxEv7MAxl4dywt7WMudL0',
//   authDomain: 'm2a-pilot100.firebaseapp.com',
//   projectId: 'm2a-pilot100',
//   storageBucket: 'm2a-pilot100.firebasestorage.app',
//   messagingSenderId: '394031914226',
//   appId: '1:394031914226:web:1558592ef8b3c8c24f846b',
//   measurementId: 'G-1C427KH30J',
// };

const firebaseConfig = {
  apiKey: "AIzaSyCUwTEvI-mUlG44eHe-UVFbWo1sFXzfHd0",
  authDomain: "clinic-hub-ec9d7.firebaseapp.com",
  projectId: "clinic-hub-ec9d7",
  storageBucket: "clinic-hub-ec9d7.firebasestorage.app",
  messagingSenderId: "1067478681574",
  appId: "1:1067478681574:web:ee444f3c73be29fc833827",
  measurementId: "G-V69FGR3VKB",
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
