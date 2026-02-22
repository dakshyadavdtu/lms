// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_APPID,
  appId: import.meta.env.VITE_FIREBASE_APIKEY
};

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);






// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_APIKEY ,
//   authDomain: "lms-learnspace.firebaseapp.com",
//   projectId: "lms-learnspace",
//   storageBucket: "lms-learnspace.firebasestorage.app",
//   messagingSenderId: "794813288828",
//   appId: "1:794813288828:web:37c234185c0684fe13d4f9",
//   measurementId : "G-3NLBF1YZ8B"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

// Always show Google account chooser
provider.setCustomParameters({
  prompt: "select_account",
});

export {auth,provider}