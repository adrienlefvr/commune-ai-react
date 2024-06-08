import React, { useState, useRef } from "react";
import "./App.css";
import Menu from "./components/Menu";
import Room from "./components/Room";
import MyResults from "./components/MyResults";
import GroupResults from "./components/GroupResults";
import SharedRoom from "./components/SharedRoom";
import EndScreen from "./components/EndScreen";

import { AppContext } from "./Helpers/Contexts";

function App() {
  const [appState, setAppState] = useState("menu");
  const [room, setRoom] = useState(null);
  const [isAuth, setIsAuth] = useState(null);

  return (
    <div className= "App">
      <AppContext.Provider value={{appState, setAppState, room, setRoom, isAuth, setIsAuth}}>
        {appState === "menu" && <Menu />}
        {appState === "room" && <Room />}
        {appState === "myResults" && <MyResults />}
        {appState === "sharedRoom" && <SharedRoom />}
        {appState === "groupResults" && <GroupResults />}
        {appState === "endScreen" && <EndScreen />}
      </AppContext.Provider>

      
    </div>
  );
}

export default App;