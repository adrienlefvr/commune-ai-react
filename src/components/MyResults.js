import { collection, query, where, getDocs } from 'firebase/firestore';
import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../Helpers/Contexts";
import { auth, db } from "../firebase-config";

function MyResults() {
    const currentUser = auth.currentUser.uid;
    const { room, setAppState } = useContext(AppContext);
    const [value, setValue] = useState(null);
    const [message, setMessage] = useState(null);
    const [parsedResponse, setParsedResponse] = useState([]);

    useEffect(() => {
        const fetchSubmissionData = async () => {
            try {
                const submissionQuery = query(collection(db, "messages"), where("user", "==", currentUser), where("room", "==", room));
                const submissionSnapshot = await getDocs(submissionQuery);
                if (!submissionSnapshot.empty) {
                    const data = submissionSnapshot.docs[0].data();
                    setValue(data.valueEmbed);  // Fetching valueEmbed
                    setMessage(data.message);   // Fetching message
                }
            } catch (error) {
                console.error("Error fetching submission data:", error);
            }
        };

        fetchSubmissionData();
    }, [currentUser, room]);

    // Separate useEffect for parsing value if needed
    useEffect(() => {
        if (value) {
            try {
                // Assuming value is JSON that needs parsing
                const parsed = JSON.parse(value.replace(/'/g, '"'));
                setParsedResponse(parsed);
            } catch (parseError) {
                console.error("Error parsing API response:", parseError);
            }
        }
    }, [value]);  // This useEffect depends on `value`

    return (
        <div className="results-container">
            <div className="results-message">My results: {message}</div>
            <div>
                {parsedResponse.length > 0 && (
                    <div className="results-array">
                        {parsedResponse.map((item, index) => (
                            <div key={index} className="array-item">{item}</div>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={() => setAppState("groupResults")}>
                See group results
            </button>
        </div>
    );
}

export default MyResults;
