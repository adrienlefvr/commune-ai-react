import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../Helpers/Contexts";
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { signOut } from "firebase/auth";
import Cookies from "universal-cookie";
import '../App.css';
import Masonry from "react-masonry-css";
import {
    addDoc,
    collection,
    serverTimestamp,
    query,
    where,
    getDocs,
    updateDoc,
    doc, 
    onSnapshot, 
    orderBy
} from 'firebase/firestore';
import { functions, auth, db } from "../firebase-config";
import { httpsCallable } from 'firebase/functions';

const callOpenAIAPI = httpsCallable(functions, 'callOpenAIAPI');

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function SharedRoom() {
    const [newScenario, setNewScenario] = useState("");
    const [roomData, setRoomData] = useState(null);
    const [apiResponse, setApiResponse] = useState('');


    const { appState, setAppState, room, setRoom, setIsAuth } = useContext(AppContext);
    const [groupValues, setGroupValues] = useState({});
    const [totalUsers, setTotalUsers] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [scenarios, setScenarios] = useState([]);
    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);  // Track submission state
    const cookies = new Cookies();

    useEffect(() => {
        const fetchData = async () => {
            const roomQuery = query(collection(db, "rooms"), where("roomName", "==", room));
            const roomSnapshot = await getDocs(roomQuery);
            if (!roomSnapshot.empty) {
                setRoomData(roomSnapshot.docs[0].data());
            }

            /* const messageQuery = query(collection(db, "messages"), where("user", "==", auth.currentUser.uid), where("room", "==", room));
            const messageSnapshot = await getDocs(messageQuery);
            if (!messageSnapshot.empty) {
                setNewMessage(messageSnapshot.docs[0].data().message);
            } */
        };

        fetchData();
    }, [room]);

    useEffect(() => {
        const commentsQuery = query(
            collection(db, "comments"),
            where("room", "==", room),
            orderBy("createdAt", "desc")
        );
    
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            let valuesCount = {};
            let userContributions = {};
            let fetchedComments = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                fetchedComments.push(data);
                const userId = data.user;
                
                if (!userContributions[userId]) {
                    userContributions[userId] = new Set();
                }
    
                if (data.valueEmbed && scenarios.length > currentScenarioIndex && data.scenarioId === scenarios[currentScenarioIndex].id) {
                    try {
                        const values = JSON.parse(data.valueEmbed.replace(/'/g, '"'));
                        values.forEach(value => {
                            if (!userContributions[userId].has(value)) {
                                valuesCount[value] = (valuesCount[value] || 0) + 1;
                                userContributions[userId].add(value);
                            }
                        });
                    } catch (parseError) {
                    console.error("Failed to parse valueEmbed:", parseError);
                }
            }
        });
    
        // Calculate the total number of unique users
        const totalUsersCount = Object.keys(userContributions).length;
        setComments(fetchedComments);
        setGroupValues(valuesCount);
        console.log("Group values: ", valuesCount);
        setTotalUsers(totalUsersCount);
        console.log("Current users: ", totalUsersCount);
        });
    
        return () => unsubscribe();
    }, [room, currentScenarioIndex, scenarios]);  // Ensure scenarios is listed in the dependencies
    
    
    

    

    useEffect(() => {
        const scenariosQuery = query(
            collection(db, "scenarios"),
            where("room", "==", room)
        );

        const unsubscribe = onSnapshot(scenariosQuery, (snapshot) => {
            const fetchedScenarios = snapshot.docs.map(doc => ({
                id: doc.id,
                content: doc.data().scenario
            }));
            setScenarios(fetchedScenarios);
        });

        return () => unsubscribe();
    }, [room]);

    const handleNextScenario = () => {
        if (currentScenarioIndex < scenarios.length - 1) {
            setCurrentScenarioIndex(currentScenarioIndex + 1);
        } else {
            // Navigate to the end screen if it's the last scenario
            setAppState("endScreen");
        }
    };

    const handlePreviousScenario = () => {
        if (currentScenarioIndex > 0) {
            setCurrentScenarioIndex(currentScenarioIndex - 1);
        }
    };

    const renderScenarioCard = () => {
        if (scenarios.length === 0) {
            return <p>No scenarios available</p>;
        }
        return (
            <div className="scenario-card">
                <div className="mini-label">SCENARIO</div>
                <p>{scenarios[currentScenarioIndex].content}</p>
                <div className="navigation-buttons">
                    <button onClick={handlePreviousScenario}>Previous</button>
                    <span>{currentScenarioIndex + 1} / {scenarios.length}</span>
                    <button onClick={handleNextScenario}>{currentScenarioIndex < scenarios.length - 1 ? "Next" : "Exit"}</button>
                </div>
            </div>
        );
    };

    const options = {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
            r: {
                angleLines: {
                    display: false
                },
                suggestedMin: 0,
                suggestedMax: 100,
                ticks: {
                    display: false
                }
            }
        },
        elements: {
            line: {
                borderWidth: 5
            }
        },
        plugins: {
            legend: {
                display: false // Set display to false to remove the legend
            },
            tooltip: {
                enabled: false // Disable tooltip if needed
            }
        },
        // Increase font size for value labels
        scale: {
            pointLabels: {
                font: {
                    size: 18 // Adjust the font size as needed
                }
            }
        }
    };
    

    const breakpoints = {
        default:3,
        1100: 2,
        700: 1
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // Start submitting
        const CommentsRef = collection(db, "comments");
        const groupValuesList = Object.keys(groupValues).join(", ");
        console.log(groupValuesList);
        const prompt = "Research topic: " + roomData.topic + "\nIdentify underlying human values that motivate this stakeholder's testimony: " + newComment + "\nSelect a minimum of 0 and up to 5, depending on how many ideas are expressed in the statement. Present the result as a JavaScript array compatible for parsing, using this example format: ['caring', 'honest', 'resilient', 'self-maintaining', 'self-assured']. If any values identified are have semantic similarity with any value in the following list, then change the wording to match it. List: "+ groupValuesList;
        console.log(prompt);

        try {
            const response = await callOpenAIAPI({prompt});
            setApiResponse(response);
            console.log("Your values are: "+ response.data.result);
    
            const existingMsgQuery = query(CommentsRef, where("user", "==", auth.currentUser.uid), where("room", "==", room));
            const querySnapshot = await getDocs(existingMsgQuery);
    
            // Fetch the ID of the current scenario displayed
            const scenarioId = scenarios[currentScenarioIndex].id; // Assuming scenario text is unique
            //console.log("Current Scenario ID:", scenarioId);
    
            if (!querySnapshot.empty) {
                await addDoc(CommentsRef, {
                    comment: newComment,
                    createdAt: serverTimestamp(),
                    user: auth.currentUser.uid,
                    valueEmbed: response.data.result,
                    room,
                    scenarioId // Add scenarioId as a property
                });
            } else {
                await addDoc(CommentsRef, {
                    comment: newComment,
                    createdAt: serverTimestamp(),
                    user: auth.currentUser.uid,
                    valueEmbed: response.data.result,
                    room,
                    scenarioId // Add scenarioId as a property
                });
            }
    
            setNewComment("");
    
        } catch (error) {
            console.error("Error calling OpenAI API or updating Firestore:", error);
        } finally {
            setIsSubmitting(false); // End submitting
        }
    };


    const data = {
        labels: Object.keys(groupValues),
        datasets: [{
            label: 'Values',
            data: Object.values(groupValues).map(value => (value / totalUsers) * 100), // divide by totalUsers to get percentage
            backgroundColor: 'rgba(75, 51, 235, 0.2)',
            borderColor: 'rgba(75, 51, 235, 1)',
            pointBackgroundColor: 'rgba(75, 51, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(75, 51, 235, 1)'
        }]
    };

    const renderNumberOfComments = () => {
        const commentsWithCurrentScenarioId = comments.filter(comment => comment.scenarioId === scenarios[currentScenarioIndex].id);
        return <div className="mini-label">{commentsWithCurrentScenarioId.length} comments</div>;
    };

    return (
        <div className="sharedRoom" >
            
            <div className="comments-container">
                {renderNumberOfComments()}
                <Masonry 
                    breakpointCols={breakpoints}
                    className="my-masonry-grid"
                    columnClassName="my-masonry-grid_column"
                >
                    {comments
                        .filter(comment => comment.scenarioId === scenarios[currentScenarioIndex].id)
                        .map((comment, index) => (
                    <div key={index}>
                {comment.comment}
            </div>
        ))}
        
                </Masonry>
            </div>

            <div className="cell-container">

            

                <div className="scenario-container">
                    {renderScenarioCard()}
                </div>
                
                <div className="cell">
                    <div className="mini-label">GROUP VALUES</div>
                        <div style={{
                            maxWidth: '1000px',
                        }}>
                    {totalUsers > 0 ? (
                        <Radar data={data} options={options} height={500} />
                    ) : (
                        <p>No data available</p>
                    )}

                </div>

                </div>

                <div className="send-comment-container">
                    <textarea
                        className="new-message-input"
                        placeholder="Write a comment"
                        onChange={(e) => setNewComment(e.target.value)}
                        value={newComment}
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        className="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !newComment.trim()} // Disable if submitting or textarea is empty
                    >
                        {isSubmitting ? "Sending..." : "Send"}
                    </button>
                    
                </div>
            </div>
        </div>
    );
}

export default SharedRoom;
