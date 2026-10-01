import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, Music, Volume2, VolumeX } from "lucide-react";
import {
  BLOOMS,
  CAKES,
  CLOTHS,
  DRESS_NAME,
  JEWELS,
  PRINCESSES,
  SHOES,
  TREATS,
  artDress,
  asset,
  validSave,
  type Save,
  type Tea,
} from "@/game/data";
import {
  setTune,
  sfxChime,
  sfxCheer,
  sfxPop,
  sfxPour,
  sfxSparkle,
  speak,
  startAudio,
  toggleMusic,
  toggleVoice,
} from "@/game/audio";

type Screen = "splash" | "pick" | "dress" | "shoes" | "jewel" | "name" | "gallery" | "parade" | "tea" | "dance";

const KEY = "princessTwirl.v2";
const MOVES = ["twirl", "sway", "bounce", "shimmy"] as const;
const MOVE_LABEL = { twirl: "Twirl", sway: "Sway", bounce: "Bounce", shimmy: "Shimmy" };

const LINES: Record<string, string> = {
  "hello-0": "Hi! I'm Lily.",
  "hello-1": "Hi! I'm Coral.",
  "hello-2": "Hi! I'm Winter.",
  "hello-3": "Hi! I'm Rosie.",
  "hello-4": "Hi! I'm Luna.",
  "hello-5": "Hi! I'm Skye.",
  dress: "I love this dress!",
  twirl: "Watch me twirl!",
  shoes: "These shoes are so pretty!",
  jewels: "Look at my sparkles!",
  ready: "Ta-da! I am ready to twirl!",
  parade: "Let the parade begin!",
  tea: "I love tea parties!",
  yummy: "Yummy! Thank you!",
  dance: "Dance with me!",
  sit: "I will sit right here!",
  pretty: "I feel so pretty!",
  magic: "Sparkle, sparkle, magic!",
  party: "Tea is served!",
  name: "What a beautiful name!",
};

function Figure({
  p,
  dress,
  shoes,
  jewel,
  showShoes,
  showJewel,
  spin,
}: {
  p: number;
  dress: number;
  shoes: number;
  jewel: number;
  showShoes?: boolean;
  showJewel?: boolean;
  spin?: boolean;
}) {
  const slot = jewel >= 0 ? JEWELS[jewel].slot : "";
  return (
    <div className={spin ? "figure spin" : "figure"}>
      <img className="body" src={artDress(p, dress)} alt="" draggable={false} />
      {showJewel && slot === "ears" && (
        <>
          <img className="gem ear left" src={asset(`/art/jewel-${jewel}.png`)} alt="" />
          <img className="gem ear right" src={asset(`/art/jewel-${jewel}.png`)} alt="" />
        </>
      )}
      {showJewel && slot && slot !== "ears" && <img className={`gem ${slot}`} src={asset(`/art/jewel-${jewel}.png`)} alt="" />}
      {showShoes && <img className="feet" src={asset(`/art/shoe-${shoes}.png`)} alt="" />}
    </div>
  );
}

function Cake({ kind }: { kind: string }) {
  const n = kind === "rainbow" ? 4 : 3;
  return (
    <div className={`cake ${kind}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}

function Blooms({ kind }: { kind: string }) {
  return (
    <div className={`blooms ${kind}`} aria-hidden>
      <i />
      <i />
      <i />
    </div>
  );
}

function Treat({ kind }: { kind: string }) {
  if (kind === "tea") return <div className="treat mini"><i className="teaCup" /></div>;
  if (kind === "cookie") return <div className="treat mini"><i className="cookie" /></div>;
  if (kind === "macaron") return <div className="treat mini"><i className="macaron" /></div>;
  if (kind === "slice") return <Cake kind="berry" />;
  return <Cake kind="flower" />;
}

export function PrincessTwirl() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [p, setP] = useState(0);
  const [di, setDi] = useState(0);
  const [si, setSi] = useState(0);
  const [ji, setJi] = useState(0);
  const [g, setG] = useState(0);
  const [saved, setSaved] = useState<Save[]>([]);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState("");
  const [mv, setMv] = useState(0);
  const [music, setMusic] = useState(true);
  const [voice, setVoice] = useState(true);
  const [tea, setTea] = useState<Tea | null>(null);
  const [askAway, setAskAway] = useState(false);
  const [line, setLine] = useState("");
  const fx = useRef<HTMLDivElement>(null);
  const lineTimer = useRef(0);
  const talk = useRef(0);
  const bag = useRef({ screen, p, di, si, ji, g, saved, tea, askAway });
  bag.current = { screen, p, di, si, ji, g, saved, tea, askAway };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const arr = JSON.parse(raw) as Save[];
        if (Array.isArray(arr)) setSaved(arr.filter(validSave));
      }
    } catch {
      /* ignore bad saves */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(saved));
  }, [ready, saved]);

  useEffect(() => {
    if (!ready) return;
    if (saved.length === 0 && (screen === "gallery" || screen === "parade" || screen === "tea" || screen === "dance")) {
      setScreen("pick");
      setTune("waltz");
    }
  }, [ready, saved.length, screen]);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".opt.sel, .card.sel");
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [screen, p, di, si, ji, g, tea]);

  function say(id: string) {
    speak(id);
    const text = LINES[id];
    if (!text) return;
    setLine(text);
    window.clearTimeout(lineTimer.current);
    lineTimer.current = window.setTimeout(() => setLine(""), 2400);
  }

  function burst(x: number, y: number, n = 16) {
    const root = fx.current;
    if (!root) return;
    const colors = ["#fff", "#ffd36a", "#ff8fc5", "#9ad8ff", "#c6a9ff"];
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      const a = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 90;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty("--dx", `${Math.cos(a) * r}px`);
      s.style.setProperty("--dy", `${Math.sin(a) * r}px`);
      s.style.setProperty("--c", colors[i % colors.length]);
      root.appendChild(s);
      window.setTimeout(() => s.remove(), 900);
    }
  }

  function celebrate(big = false) {
    const root = fx.current;
    if (!root) return;
    const colors = ["#ff5e7e", "#ffd36a", "#5cd67a", "#4fc3f7", "#c6a9ff", "#fff"];
    const count = big ? 80 : 40;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "conf";
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = "20%";
      s.style.setProperty("--dx", `${Math.random() * 120 - 60}px`);
      s.style.setProperty("--c", colors[i % colors.length]);
      root.appendChild(s);
      window.setTimeout(() => s.remove(), 1700);
    }
    burst(window.innerWidth / 2, window.innerHeight * 0.4, big ? 24 : 12);
    if (big) sfxCheer();
    else sfxPop();
  }

  function go(next: Screen) {
    setScreen(next);
    setAskAway(false);
    if (next === "tea") setTune("tea");
    else if (next === "dance") setTune("dance");
    else setTune("waltz");
  }

  function back() {
    const s = bag.current.screen;
    if (s === "dress") go("pick");
    else if (s === "shoes") go("dress");
    else if (s === "jewel") go("shoes");
    else if (s === "name") go("jewel");
    else if (s === "pick") go(bag.current.saved.length ? "gallery" : "splash");
    else if (s === "parade" || s === "dance" || s === "tea") go("gallery");
    else if (s === "gallery") go("splash");
    sfxSparkle();
  }

  function confirmPick() {
    sfxChime();
    say(`hello-${bag.current.p}`);
    setDi(0);
    setSi(0);
    setJi(0);
    go("dress");
  }

  function confirmDress() {
    sfxChime();
    say("dress");
    go("shoes");
  }

  function confirmShoes() {
    sfxChime();
    say("shoes");
    go("jewel");
  }

  function confirmJewel() {
    sfxChime();
    say("jewels");
    setDraft("");
    go("name");
  }

  function finishName() {
    const b = bag.current;
    const princess = PRINCESSES[b.p];
    let name = draft.trim().replace(/\s+/g, " ");
    if (!name) name = princess.def;
    name = (name.charAt(0).toUpperCase() + name.slice(1)).slice(0, 16);
    const item: Save = { p: b.p, dress: princess.dresses[b.di], shoes: b.si, jewel: b.ji, name };
    setSaved((list) => [...list, item]);
    setG(b.saved.length);
    celebrate(true);
    speak("ready");
    setLine(`${name} is ready to twirl!`);
    window.clearTimeout(lineTimer.current);
    lineTimer.current = window.setTimeout(() => setLine(""), 2600);
    go("gallery");
  }

  function move(dir: number) {
    const b = bag.current;
    sfxSparkle();
    if (b.screen === "pick") {
      const n = PRINCESSES.length;
      const np = (b.p + dir + n) % n;
      setP(np);
      setDi(0);
    } else if (b.screen === "dress") {
      const n = PRINCESSES[b.p].dresses.length;
      setDi((b.di + dir + n) % n);
    } else if (b.screen === "shoes") {
      setSi((b.si + dir + SHOES.length) % SHOES.length);
    } else if (b.screen === "jewel") {
      setJi((b.ji + dir + JEWELS.length) % JEWELS.length);
    } else if (b.screen === "gallery" && b.saved.length) {
      setG((b.g + dir + b.saved.length) % b.saved.length);
    } else if (b.screen === "dance") {
      setMv((m) => (m + dir + MOVES.length) % MOVES.length);
    }
  }

  function beginTea() {
    const list = bag.current.saved;
    const seats = Math.min(4, list.length);
    if (!seats) return;
    setTea({
      phase: "guest",
      seats,
      seated: Array(seats).fill(-1),
      gi: 0,
      ci: 0,
      cloth: 0,
      cake: 0,
      flow: 0,
      dec: "cloth",
      served: list.map(() => ({ tea: false, items: [] })),
      tray: false,
      ti: 0,
      pick: 0,
    });
    go("tea");
    say("tea");
  }

  function startDecorate() {
    setTea((prev) => {
      if (!prev || prev.phase === "decorate" || prev.phase === "serve") return prev;
      const seated = prev.seated.some((s) => s >= 0) ? prev.seated.slice() : prev.seated.map((s, i) => (i === 0 ? 0 : s));
      return { ...prev, phase: "decorate", dec: "cloth", seated };
    });
    say("party");
    sfxCheer();
  }

  function teaAction(k: string) {
    const T = bag.current.tea;
    const saves = bag.current.saved;
    if (!T) return;
    const left = k === "ArrowLeft" || k === "ArrowUp";
    const right = k === "ArrowRight" || k === "ArrowDown";
    const yes = k === "Enter" || k === " ";
    const no = k === "Backspace" || k === "Escape";
    if (T.phase === "guest") {
      const wait = saves.map((_, i) => i).filter((i) => !T.seated.includes(i));
      const n = wait.length + 1;
      if (left || right) {
        setTea({ ...T, gi: (T.gi + (left ? -1 : 1) + n) % n });
        sfxSparkle();
      } else if (yes) {
        if (T.gi === wait.length || !wait.length || !T.seated.includes(-1)) startDecorate();
        else {
          setTea({ ...T, pick: wait[T.gi], phase: "seat", ci: T.seated.indexOf(-1) });
          sfxChime();
        }
      } else if (no) go("gallery");
    } else if (T.phase === "seat") {
      const empties = T.seated.map((s, i) => (s < 0 ? i : -1)).filter((i) => i >= 0);
      if (left || right) {
        const cur = Math.max(0, empties.indexOf(T.ci));
        setTea({ ...T, ci: empties[(cur + (left ? -1 : 1) + empties.length) % empties.length] });
        sfxSparkle();
      } else if (yes) {
        const seated = T.seated.slice();
        seated[T.ci] = T.pick;
        setTea({ ...T, seated, phase: "guest", gi: 0 });
        say("sit");
        sfxChime();
        celebrate(false);
        const still = saves.map((_, i) => i).filter((i) => !seated.includes(i));
        if (!still.length || !seated.includes(-1)) window.setTimeout(startDecorate, 800);
      } else if (no) setTea({ ...T, phase: "guest" });
    } else if (T.phase === "decorate") {
      const items = T.dec === "cloth" ? CLOTHS : T.dec === "cake" ? CAKES : BLOOMS;
      const cur = T.dec === "cloth" ? T.cloth : T.dec === "cake" ? T.cake : T.flow;
      if (left || right) {
        const next = (cur + (left ? -1 : 1) + items.length) % items.length;
        setTea({ ...T, cloth: T.dec === "cloth" ? next : T.cloth, cake: T.dec === "cake" ? next : T.cake, flow: T.dec === "flowers" ? next : T.flow });
        sfxSparkle();
      } else if (yes) {
        sfxChime();
        if (T.dec === "cloth") setTea({ ...T, dec: "cake" });
        else if (T.dec === "cake") setTea({ ...T, dec: "flowers" });
        else setTea({ ...T, phase: "serve", ci: Math.max(0, T.seated.findIndex((s) => s >= 0)), tray: false });
      } else if (no) {
        if (T.dec === "cake") setTea({ ...T, dec: "cloth" });
        else if (T.dec === "flowers") setTea({ ...T, dec: "cake" });
        else setTea({ ...T, phase: "guest" });
      }
    } else if (T.phase === "serve") {
      const occ = T.seated.map((s, i) => (s >= 0 ? i : -1)).filter((i) => i >= 0);
      if (T.tray) {
        if (left || right) {
          setTea({ ...T, ti: (T.ti + (left ? -1 : 1) + TREATS.length) % TREATS.length });
          sfxSparkle();
        } else if (yes) {
          const si = T.seated[T.ci];
          const treat = TREATS[T.ti];
          const served = T.served.map((s) => ({ tea: s.tea, items: [...s.items] }));
          if (treat.kind === "tea") {
            served[si].tea = true;
            sfxPour();
          } else {
            served[si].items.push(treat.kind);
            if (served[si].items.length > 3) served[si].items.shift();
            sfxPop();
          }
          setTea({ ...T, served, tray: false });
          say(treat.kind === "tea" ? "pretty" : "yummy");
        } else if (no) setTea({ ...T, tray: false });
      } else if (left || right) {
        const cur = Math.max(0, occ.indexOf(T.ci));
        setTea({ ...T, ci: occ[(cur + (left ? -1 : 1) + occ.length) % occ.length] });
        sfxSparkle();
      } else if (k === "Enter") setTea({ ...T, tray: true, ti: 0 });
      else if (k === " ") {
        celebrate(true);
        say("magic");
      } else if (k === "d" || k === "D") {
        go("dance");
        say("dance");
      } else if (no) go("gallery");
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT") {
        if (e.key === "Escape") back();
        return;
      }
      startAudio();
      const k = e.key;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(k)) e.preventDefault();
      const s = bag.current.screen;
      if ((k === "m" || k === "M") && s !== "name") {
        setMusic(toggleMusic());
        return;
      }
      if ((k === "v" || k === "V") && s !== "name") {
        setVoice(toggleVoice());
        return;
      }
      if (k === "Backspace" || k === "Escape") {
        if (s === "tea") teaAction(k);
        else back();
        return;
      }
      if (s === "splash") {
        if (e.repeat) return;
        const next = bag.current.saved.length ? "gallery" : "pick";
        go(next);
        if (next === "pick") say("hello-0");
        return;
      }
      if (s === "pick" || s === "dress" || s === "shoes" || s === "jewel") {
        if (k === "ArrowLeft" || k === "ArrowUp") move(-1);
        else if (k === "ArrowRight" || k === "ArrowDown") move(1);
        else if ((k === "Enter" || k === " ") && !e.repeat) {
          if (s === "pick") confirmPick();
          else if (s === "dress") confirmDress();
          else if (s === "shoes") confirmShoes();
          else confirmJewel();
        }
      } else if (s === "gallery") {
        if (k === "ArrowLeft" || k === "ArrowUp") move(-1);
        else if (k === "ArrowRight" || k === "ArrowDown") move(1);
        else if ((k === "Enter" || k === "n" || k === "N") && !e.repeat) {
          setP(0);
          setDi(0);
          go("pick");
        } else if ((k === "p" || k === "P") && !e.repeat) {
          go("parade");
          say("parade");
        } else if ((k === "t" || k === "T") && !e.repeat) beginTea();
        else if ((k === "d" || k === "D") && !e.repeat) {
          go("dance");
          say("dance");
        } else if (k === " " && !e.repeat) {
          celebrate(true);
          say("magic");
        } else if (k === "Delete" && !e.repeat) setAskAway(true);
      } else if (s === "parade") {
        if ((k === " " || k === "Enter") && !e.repeat) {
          celebrate(true);
          say("magic");
        }
      } else if (s === "dance") {
        if (k === "ArrowLeft" || k === "ArrowUp") move(-1);
        else if (k === "ArrowRight" || k === "ArrowDown") move(1);
        else if ((k === "Enter" || k === " ") && !e.repeat) {
          celebrate(true);
          say("magic");
        }
      } else if (s === "tea") teaAction(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft]);

  useEffect(() => {
    if (screen !== "parade" && screen !== "dance") return;
    const id = window.setInterval(() => burst(window.innerWidth * Math.random(), window.innerHeight * 0.3, 8), 2600);
    return () => window.clearInterval(id);
  }, [screen]);

  const dressId = PRINCESSES[p].dresses[di];
  const showShoes = ["shoes", "jewel", "name", "gallery", "parade", "dance", "tea"].includes(screen);
  const showJewel = ["jewel", "name", "gallery", "parade", "dance", "tea"].includes(screen);
  const bg = screen === "dance" ? asset("/bg/dance.jpg") : screen === "tea" ? asset("/bg/tea.jpg") : asset("/bg/castle.jpg");
  const step = ["pick", "dress", "shoes", "jewel", "name"].indexOf(screen);

  function talkTo(id: number) {
    const ids = [`hello-${id}`, "pretty", "twirl", "dress"];
    say(ids[talk.current % ids.length]);
    talk.current++;
    sfxSparkle();
  }

  const choice = (index: number, selected: number, label: string, img: ReactNode, onChoose: () => void) => (
    <button key={label + index} type="button" className={index === selected ? "opt sel" : "opt"} onClick={onChoose}>
      <span className="optArt">{img}</span>
      <span className="lbl">{label}</span>
    </button>
  );

  let body: ReactNode = null;
  if (screen === "splash") {
    body = (
      <div className="splash">
        <h1>Princess Twirl</h1>
        <button className="figureBtn" type="button" onClick={() => talkTo(0)}>
          <Figure p={0} dress={0} shoes={0} jewel={-1} spin />
        </button>
        <p>Tap to play</p>
        <button
          className="thisone"
          type="button"
          style={{ maxWidth: 420 }}
          onClick={() => {
            startAudio();
            const next = saved.length ? "gallery" : "pick";
            go(next);
            if (next === "pick") say("hello-0");
          }}
        >
          Play
        </button>
      </div>
    );
  } else if (screen === "pick" || screen === "dress" || screen === "shoes" || screen === "jewel") {
    const title = screen === "pick" ? "Choose your princess" : screen === "dress" ? "Pick a dress" : screen === "shoes" ? "Pick her shoes" : "Pick her sparkles";
    const label = screen === "pick" ? PRINCESSES[p].name : screen === "dress" ? DRESS_NAME[dressId] : screen === "shoes" ? SHOES[si].name : JEWELS[ji].name;
    const onYes = screen === "pick" ? confirmPick : screen === "dress" ? confirmDress : screen === "shoes" ? confirmShoes : confirmJewel;
    body = (
      <div className="studio">
        <div className="stage">
          <button className="figureBtn" type="button" onClick={() => talkTo(p)}>
            <Figure p={p} dress={dressId} shoes={si} jewel={ji} showShoes={showShoes} showJewel={showJewel} spin />
          </button>
          <div className="stageLabel">{label}</div>
        </div>
        <div className="closet">
          <h2>{title}</h2>
          <div className="rail">
            {screen === "pick" &&
              PRINCESSES.map((princess, i) =>
                choice(i, p, princess.def, <img src={artDress(i, princess.dresses[0])} alt="" />, () => {
                  if (i === p) confirmPick();
                  else {
                    setP(i);
                    setDi(0);
                    sfxSparkle();
                  }
                }),
              )}
            {screen === "dress" &&
              PRINCESSES[p].dresses.map((id, i) =>
                choice(i, di, DRESS_NAME[id], <img src={artDress(p, id)} alt="" />, () => {
                  if (i === di) confirmDress();
                  else {
                    setDi(i);
                    sfxSparkle();
                  }
                }),
              )}
            {screen === "shoes" &&
              SHOES.map((shoe, i) =>
                choice(i, si, shoe.name, <img src={asset(`/art/shoe-${i}.png`)} alt="" />, () => {
                  if (i === si) confirmShoes();
                  else {
                    setSi(i);
                    sfxSparkle();
                  }
                }),
              )}
            {screen === "jewel" &&
              JEWELS.map((jewel, i) =>
                choice(i, ji, jewel.name, <img src={asset(`/art/jewel-${i}.png`)} alt="" />, () => {
                  if (i === ji) confirmJewel();
                  else {
                    setJi(i);
                    sfxSparkle();
                  }
                }),
              )}
          </div>
          <button className="thisone" type="button" onClick={onYes}>
            This one!
          </button>
          <div className="keys">Arrow keys look around. Enter picks. Backspace goes back.</div>
        </div>
      </div>
    );
  } else if (screen === "name") {
    const princess = PRINCESSES[p];
    body = (
      <div className="namer">
        <button className="figureBtn" type="button" onClick={() => talkTo(p)}>
          <Figure p={p} dress={dressId} shoes={si} jewel={ji} showShoes showJewel spin />
        </button>
        <form
          className="nameBox"
          onSubmit={(e) => {
            e.preventDefault();
            finishName();
          }}
        >
          <h2>What is her name?</h2>
          <input value={draft} maxLength={16} placeholder={princess.def} onChange={(e) => setDraft(e.target.value)} aria-label="Her name" />
          <div className="row">
            <button className="thisone" type="submit">
              {draft.trim() ? "That's her name" : `Call her ${princess.def}`}
            </button>
          </div>
        </form>
      </div>
    );
  } else if (screen === "gallery") {
    const selected = saved[g];
    body = (
      <div className="gallery">
        <h1>Your princesses</h1>
        <div className="cards">
          {saved.map((c, i) => (
            <button
              key={`${c.name}-${i}`}
              type="button"
              className={i === g ? "card sel" : "card"}
              onClick={() => {
                if (i === g) {
                  say("pretty");
                  celebrate(false);
                } else {
                  setG(i);
                  sfxSparkle();
                }
              }}
            >
              <Figure p={c.p} dress={c.dress} shoes={c.shoes} jewel={c.jewel} showShoes showJewel spin={i === g} />
              <div className="cname">{c.name}</div>
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="thisone" type="button" onClick={() => { go("parade"); say("parade"); }}>
            Parade
          </button>
          <button className="thisone" type="button" onClick={beginTea}>
            Tea party
          </button>
          <button className="thisone" type="button" onClick={() => { go("dance"); say("dance"); }}>
            Dance
          </button>
          <button
            className="ghost"
            type="button"
            onClick={() => {
              setP(0);
              setDi(0);
              go("pick");
            }}
          >
            New princess
          </button>
          <button className="ghost" type="button" onClick={() => { celebrate(true); say("magic"); }}>
            Magic
          </button>
        </div>
        {selected && !askAway && (
          <button className="away" type="button" onClick={() => setAskAway(true)}>
            Put {selected.name} away
          </button>
        )}
        {askAway && selected && (
          <div className="actions">
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setSaved((list) => list.filter((_, i) => i !== g));
                setG((i) => Math.max(0, i - 1));
                setAskAway(false);
                sfxPop();
              }}
            >
              Yes, put her away
            </button>
            <button className="thisone" type="button" onClick={() => setAskAway(false)}>
              Keep her
            </button>
          </div>
        )}
      </div>
    );
  } else if (screen === "parade") {
    const dur = Math.max(14, saved.length * 4);
    body = (
      <div className="parade">
        <h1>Princess Parade!</h1>
        {saved.map((c, i) => (
          <div key={`${c.name}-${i}`} className="walker" style={{ ["--dur" as string]: `${dur}s`, animationDelay: `${(-i * dur) / saved.length}s` }}>
            <div className="bob">
              <Figure p={c.p} dress={c.dress} shoes={c.shoes} jewel={c.jewel} showShoes showJewel />
              <div className="cname">{c.name}</div>
            </div>
          </div>
        ))}
        <div className="dancebar">
          <button className="thisone" type="button" onClick={() => { celebrate(true); say("magic"); }}>
            Fireworks
          </button>
        </div>
      </div>
    );
  } else if (screen === "dance") {
    const guests = tea && tea.seated.some((s) => s >= 0) ? tea.seated.filter((s) => s >= 0).map((i) => saved[i]).filter(Boolean) : saved;
    body = (
      <div className={`dance mv-${MOVES[mv]}`}>
        <h1>{MOVE_LABEL[MOVES[mv]]}!</h1>
        <div className="dancers">
          {guests.map((c, i) => (
            <button key={`${c.name}-${i}`} className="dancer" type="button" onClick={() => setMv((m) => (m + 1) % MOVES.length)}>
              <Figure p={c.p} dress={c.dress} shoes={c.shoes} jewel={c.jewel} showShoes showJewel spin={MOVES[mv] === "twirl"} />
              <div className="cname">{c.name}</div>
            </button>
          ))}
        </div>
        <div className="dancebar">
          <button className="ghost" type="button" onClick={() => setMv((m) => (m + 1) % MOVES.length)}>
            New dance
          </button>
          <button className="thisone" type="button" onClick={() => { celebrate(true); say("magic"); }}>
            Confetti
          </button>
        </div>
      </div>
    );
  } else if (screen === "tea" && tea) {
    const wait = saved.map((_, i) => i).filter((i) => !tea.seated.includes(i));
    body = (
      <div className="tea">
        <div className="banner">
          {tea.phase === "guest" ? "Who is coming?" : tea.phase === "seat" ? "Where does she sit?" : tea.phase === "decorate" ? (tea.dec === "cloth" ? "Pick a cloth" : tea.dec === "cake" ? "Pick a cake" : "Pick the flowers") : tea.tray ? "What would she like?" : "Serve the tea"}
        </div>
        <div className="wash" style={{ background: CLOTHS[tea.cloth].color }} />
        <div className="seatline">
          {tea.seated.map((si, i) => {
            const who = si >= 0 ? saved[si] : null;
            const hot = (tea.phase === "seat" && tea.ci === i) || (tea.phase === "serve" && !tea.tray && tea.ci === i);
            return (
              <button
                key={i}
                type="button"
                className={hot ? "seat on" : "seat"}
                onClick={() => {
                  if (tea.phase === "seat" && si < 0) {
                    const seated = tea.seated.slice();
                    seated[i] = tea.pick;
                    setTea({ ...tea, seated, ci: i, phase: "guest", gi: 0 });
                    say("sit");
                    sfxChime();
                    celebrate(false);
                    const still = saved.map((_, n) => n).filter((n) => !seated.includes(n));
                    if (!still.length || !seated.includes(-1)) window.setTimeout(startDecorate, 800);
                  } else if (tea.phase === "serve" && si >= 0 && !tea.tray) {
                    setTea({ ...tea, ci: i, tray: true, ti: 0 });
                  }
                }}
              >
                {!who && <div className="seatRing" />}
                {who && (
                  <>
                    <Figure p={who.p} dress={who.dress} shoes={who.shoes} jewel={who.jewel} showShoes showJewel />
                    <div className="treats">
                      {tea.served[si]?.tea && <Treat kind="tea" />}
                      {tea.served[si]?.items.map((kind, n) => (
                        <Treat key={kind + n} kind={kind} />
                      ))}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <div className="tablebits">
          <Cake kind={CAKES[tea.cake].kind} />
          <Blooms kind={BLOOMS[tea.flow].kind} />
        </div>
        <div className="teabar">
          {tea.phase === "guest" && (
            <div className="rail">
              {wait.map((idx, i) =>
                choice(i, tea.gi, saved[idx].name, <img src={artDress(saved[idx].p, saved[idx].dress)} alt="" />, () => {
                  if (i === tea.gi) teaAction("Enter");
                  else setTea({ ...tea, gi: i });
                }),
              )}
              {choice(wait.length, tea.gi, "Start the party", <Cake kind="flower" />, () => {
                if (tea.gi === wait.length) teaAction("Enter");
                else setTea({ ...tea, gi: wait.length });
              })}
            </div>
          )}
          {tea.phase === "decorate" && tea.dec === "cloth" && (
            <div className="rail">
              {CLOTHS.map((c, i) =>
                choice(i, tea.cloth, c.name, <span className="cake" style={{ background: c.color, borderRadius: 16 }} />, () => {
                  if (i === tea.cloth) teaAction("Enter");
                  else setTea({ ...tea, cloth: i });
                }),
              )}
            </div>
          )}
          {tea.phase === "decorate" && tea.dec === "cake" && (
            <div className="rail">
              {CAKES.map((c, i) =>
                choice(i, tea.cake, c.name, <Cake kind={c.kind} />, () => {
                  if (i === tea.cake) teaAction("Enter");
                  else setTea({ ...tea, cake: i });
                }),
              )}
            </div>
          )}
          {tea.phase === "decorate" && tea.dec === "flowers" && (
            <div className="rail">
              {BLOOMS.map((c, i) =>
                choice(i, tea.flow, c.name, <Blooms kind={c.kind} />, () => {
                  if (i === tea.flow) teaAction("Enter");
                  else setTea({ ...tea, flow: i });
                }),
              )}
            </div>
          )}
          {tea.phase === "serve" && tea.tray && (
            <div className="rail">
              {TREATS.map((c, i) =>
                choice(i, tea.ti, c.name, <Treat kind={c.kind} />, () => {
                  if (i === tea.ti) teaAction("Enter");
                  else setTea({ ...tea, ti: i });
                }),
              )}
            </div>
          )}
          {tea.phase === "serve" && !tea.tray && (
            <button className="thisone" type="button" onClick={() => { go("dance"); say("dance"); }}>
              Dance
            </button>
          )}
          {tea.phase !== "serve" && (
            <button className="thisone" type="button" onClick={() => teaAction("Enter")}>
              This one!
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="game" onPointerDown={() => startAudio()}>
      <img className="bg" src={bg} alt="" />
      <div className="fx" ref={fx} />
      {line && <div className="bubble">{line}</div>}
      <header className="top">
        {screen !== "splash" ? (
          <button className="back" type="button" aria-label="Go back" onClick={back}>
            <ChevronLeft />
          </button>
        ) : (
          <span className="back" style={{ visibility: "hidden" }} />
        )}
        <div className="steps">
          {step >= 0 &&
            ["Princess", "Dress", "Shoes", "Jewels", "Name"].map((label, i) => (
              <div key={label} className={i === step ? "step on" : i < step ? "step done" : "step"}>
                {label}
              </div>
            ))}
        </div>
        <button
          className={music ? "iconbtn" : "iconbtn off"}
          type="button"
          aria-label="Music"
          onClick={() => {
            startAudio();
            setMusic(toggleMusic());
          }}
        >
          <Music />
        </button>
        <button
          className={voice ? "iconbtn" : "iconbtn off"}
          type="button"
          aria-label="Princess voice"
          onClick={() => setVoice(toggleVoice())}
        >
          {voice ? <Volume2 /> : <VolumeX />}
        </button>
      </header>
      <main className="play">{body}</main>
    </div>
  );
}
