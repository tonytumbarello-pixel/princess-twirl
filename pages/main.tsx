import { createRoot } from "react-dom/client";
import { PrincessTwirl } from "../src/game/PrincessTwirl";
import "../src/styles.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<PrincessTwirl />);
