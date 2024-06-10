import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../Helpers/Contexts";
import {
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    getDocs,
    updateDoc,
    doc
} from 'firebase/firestore';
import { functions, auth, db } from "../firebase-config";
//import { callOpenAIAPI } from './openAiRequest';
import { httpsCallable } from 'firebase/functions';
import '../App.css'; // Import the CSS file




function Room() {
    const { setAppState, room } = useContext(AppContext);
    const [newScenario, setNewScenario] = useState("");
    const [roomData, setRoomData] = useState(null);
    const [apiResponse, setApiResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);  // Track submission state

    useEffect(() => {
        const fetchData = async () => {
            const roomQuery = query(collection(db, "rooms"), where("roomName", "==", room));
            const roomSnapshot = await getDocs(roomQuery);
            if (!roomSnapshot.empty) {
                setRoomData(roomSnapshot.docs[0].data());
            }

            const scenarioQuery = query(collection(db, "scenarios"), where("user", "==", auth.currentUser.uid), where("room", "==", room));
            const scenarioSnapshot = await getDocs(scenarioQuery);
            if (!scenarioSnapshot.empty) {
                setNewScenario(scenarioSnapshot.docs[0].data().scenario);
            } 
        };

        fetchData();
    }, [room]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // Start submitting
        const ScenariosRef = collection(db, "scenarios");
    
        try {
            //const response = await callOpenAIAPI(roomData.topic, newScenario);
            //setApiResponse(response);
            //console.log("this is the api repsonse: " + response.data);

            const existingMsgQuery = query(ScenariosRef, where("user", "==", auth.currentUser.uid), where("room", "==", room));
            const querySnapshot = await getDocs(existingMsgQuery);
    
            if (!querySnapshot.empty) {
                const scenarioDocRef = doc(db, "scenarios", querySnapshot.docs[0].id);
                await updateDoc(scenarioDocRef, {
                    scenario: newScenario,
                    createdAt: serverTimestamp(),
                    //valueEmbed: response.data.result
                });
                
            } else {
                await addDoc(ScenariosRef, {
                    scenario: newScenario,
                    createdAt: serverTimestamp(),
                    user: auth.currentUser.uid,
                    //valueEmbed: response.data.result,
                    room
                });
            }
    
            setNewScenario("");
            setAppState("sharedRoom");
    
        } catch (error) {
            console.error("Error calling OpenAI API or updating Firestore:", error);
        } finally {
            setIsSubmitting(false); // End submitting
        }
    };

    return (
        <div className="room">
            <div className="room-container">
                {roomData ? (
                    <>
                        <div className="room-left">
                            
                            <div className="cell">
                                <div className='mini-label'>TOPIC</div>
                                <p>{roomData.topic}</p>
                            </div>
                        </div>
                        <div className="room-right">
                            <textarea
                                className="new-message-input"
                                placeholder="Type your answer here..."
                                onChange={(e) => setNewScenario(e.target.value)}
                                value={newScenario}
                                disabled={isSubmitting}
                            />
                            <div className="textarea-bottom-container">
                                <div>
                                    <span className="mini-label">{newScenario.length} / 600</span>
                                </div>
                                
                                <button
                                    type="submit"
                                    className="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !newScenario.trim()} // Disable if submitting or textarea is empty
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </div>
    );
}

export default Room;




