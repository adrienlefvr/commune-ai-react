import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "../Helpers/Contexts";
import { db } from "../firebase-config";
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { signOut } from "firebase/auth";
import { auth } from "../firebase-config";
import Cookies from "universal-cookie";
import '../App.css';
import Masonry from "react-masonry-css";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function GroupResults() {
    const { appState, setAppState, room, setRoom, setIsAuth } = useContext(AppContext);
    const [groupValues, setGroupValues] = useState({});
    const [totalUsers, setTotalUsers] = useState(0);
    const [messages, setMessages] = useState([]);
    const cookies = new Cookies();

    useEffect(() => {
        const messagesQuery = query(
            collection(db, "messages"),
            where("room", "==", room),
            orderBy("createdAt", "desc") // Change order to descending
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            let valuesCount = {};
            let userCount = 0;
            let fetchedMessages = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                fetchedMessages.push(data);

                if (data.valueEmbed) {
                    const values = JSON.parse(data.valueEmbed.replace(/'/g, '"'));
                    values.forEach(value => {
                        if (valuesCount[value]) {
                            valuesCount[value]++;
                        } else {
                            valuesCount[value] = 1;
                        }
                    });
                }
                userCount++;
            });

            setGroupValues(valuesCount);
            setTotalUsers(userCount);
            setMessages(fetchedMessages);
        });

        return () => unsubscribe();
    }, [room]);

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
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 16
                    }
                }
            }
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

    const breakpoints = {
        default:3,
        1100: 2,
        700: 1
    }

    return (
        <div className="room" >
            <label style={{ margin: '20px', fontSize: '20px', fontWeight: 'bold' }}>Your group holds the following values</label>
            <div style={{
                padding: '20px',
                width: '100%',
                maxWidth: '1000px',
            }}>
                {totalUsers > 0 ? (
                    <Radar data={data} options={options} height={500} />
                ) : (
                    <p>No data available</p>
                )}
            </div>
            <div className="messages-container">
                <div className="mini-label">{messages.length} comments</div>
                <Masonry 
                    breakpointCols={breakpoints}
                    className="my-masonry-grid"
                    columnClassName="my-masonry-grid_column"
                >
                    {messages.map((message, index) => (
                        <div key={index}>
                            {message.message}
                        </div>
                    ))}
                </Masonry>
            </div>
            <button onClick={handleSignOut} style={{ marginTop: '20px' }}>Exit</button>
        </div>
    );
}

export default GroupResults;



