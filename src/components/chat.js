import { useState, useEffect } from "react";
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from "../firebase-config";

export const Chat = (props) => {
    const { room } = props;
    const [newMessage, setNewMessage] = useState("");
    const [roomData, setRoomData] = useState(null);

    const messagesRef = collection(db, "messages");

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const roomQuery = query(collection(db, "rooms"), where("roomName", "==", room));
                const roomSnapshot = await getDocs(roomQuery);
                if (!roomSnapshot.empty) {
                    const roomDoc = roomSnapshot.docs[0].data();
                    setRoomData(roomDoc);
                }
            } catch (error) {
                console.error("Error fetching room data:", error);
            }
        };

        fetchRoomData();
    }, [room]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(newMessage);

        await addDoc(messagesRef, {
            text: newMessage,
            createdAt: serverTimestamp(),
            user: auth.currentUser.uid,
            room,
        });
        setNewMessage("");
    };

    return (
        <div className="chat-app">
            <div className="room-banner">{roomData ? roomData.roomName : 'Loading...'}</div>
            {roomData && (
                <div className="room-details">
                    <img src={roomData.image} alt={roomData.description} />
                    <p>{roomData.description}</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="new-message-form">
                <textarea
                    className="new-message-input"
                    placeholder="Type your answer here"
                    onChange={(e) => setNewMessage(e.target.value)}
                    value={newMessage}
                />
                <button type="submit" className="send-button">
                    Submit
                </button>
            </form>
        </div>
    );
};