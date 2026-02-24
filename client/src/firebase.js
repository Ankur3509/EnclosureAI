import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBVrUadVQJVt725OsMKYFSmyTCIXKr-7jY",
    authDomain: "enclosureai.firebaseapp.com",
    projectId: "enclosureai",
    storageBucket: "enclosureai.firebasestorage.app",
    messagingSenderId: "996706892968",
    appId: "1:996706892968:web:75504c9952924afc4f569d",
    measurementId: "G-64FMEH0MG7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Login Error:", error);
        throw error;
    }
};

export const logout = () => signOut(auth);

// Trial System: 5 free generations
export const getUserTrialStatus = async (email) => {
    const userRef = doc(db, "users", email);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // Initialize user in Firestore
        await setDoc(userRef, {
            promptsUsed: 0,
            createdAt: serverTimestamp(),
            email: email
        });
        return { promptsUsed: 0 };
    }

    return userSnap.data();
};

export const incrementPromptCount = async (email) => {
    const userRef = doc(db, "users", email);
    await updateDoc(userRef, {
        promptsUsed: increment(1)
    });
};
