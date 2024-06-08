import React, { useContext, useState, useRef } from "react";
import { AppContext } from "../Helpers/Contexts";
import Cookies from "universal-cookie";
import { db, auth, signInAnonymously } from "../firebase-config";
import { getDoc, doc } from "firebase/firestore";

const cookies = new Cookies();

function Menu() {
    
    const [errorMessage, setErrorMessage] = useState("");
    const { appState, setAppState, room, setRoom ,isAuth, setIsAuth} = useContext(AppContext);

  
    const roomInputRef = useRef(null);
  
    const handleJoinRoom = async () => {
      
      const roomName = roomInputRef.current.value.trim();
      if (roomName === "") {
        setErrorMessage("Room name cannot be empty");
        return;
      }
  
      // First, check if the room exists in Firestore
      const roomRef = doc(db, "rooms", roomName);
      const docSnap = await getDoc(roomRef);
      if (docSnap.exists()) {
        // Only attempt to sign in if the room exists
        setIsAuth(cookies.get("auth-token"));
        if (!isAuth) {
          try {
            await signInAnonymously(auth);
            cookies.set("auth-token", auth.currentUser.uid, { path: "/" });
            console.log("logged in as:"+ auth.currentUser.uid);
            setIsAuth(true);
          } catch (error) {
            console.error("Anonymous sign-in failed:", error);
            setErrorMessage("Failed to sign in anonymously. Please try again.");
            return;
          }
        }
        setRoom(roomName);
        setAppState("room");
        setErrorMessage(""); // Clear any previous error message
      } else {
        setErrorMessage("This room doesn't exist");
      }
    };
  
    return (
      <div className="room">
          <label>Welcome to CommuneAi</label>
          <input ref={roomInputRef} placeholder="Enter room name"/>
          <button onClick={handleJoinRoom}>Join</button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    );
}

export default Menu;