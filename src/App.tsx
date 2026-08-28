import { HashRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { EditorRouter } from "./pages/EditorRouter";
import { PlayMenu } from "./pages/PlayMenu";
import { GamePage } from "./games/GamePage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edit/:setId" element={<EditorRouter />} />
        <Route path="/play/:setId" element={<PlayMenu />} />
        <Route path="/play/:setId/:gameId" element={<GamePage />} />
      </Routes>
    </HashRouter>
  );
}
