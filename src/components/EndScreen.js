import React, { useContext } from "react";
import { AppContext } from "../Helpers/Contexts";
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import Cookies from "universal-cookie";
import '../App.css';


function GroupResults() {
    const { appState, setAppState, room, setRoom, setIsAuth } = useContext(AppContext);
    const cookies = new Cookies();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            cookies.remove('auth-token', { path: '/' });
            setIsAuth(false);
            console.log("User signed out successfully");
            setRoom(null);
            setAppState("menu");
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };
    return (
        <div className="room" >
            
            <div>Thank you for joining!</div>
            <button onClick={handleSignOut} style={{ marginTop: '20px' }}>Return to home page</button>
        </div>
    );
}

export default GroupResults;