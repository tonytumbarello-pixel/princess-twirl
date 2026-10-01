import { createFileRoute } from "@tanstack/react-router";
import { PrincessTwirl } from "@/game/PrincessTwirl";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PrincessTwirl />;
}
