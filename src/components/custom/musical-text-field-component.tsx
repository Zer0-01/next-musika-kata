// app/components/MusicalTextField.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import * as Tone from "tone";

/**
 * MusicalTextField
 * A textfield styled like a primary school exercise book that produces sounds per letter.
 * Includes:
 * - Playback cursor highlight
 * - Special character handling: '.' = 3s sustain, ',' = 1s sustain
 */
export default function MusicalTextField() {
    // ---------------------------------------------------------------------------
    // 🧩 STATE
    // ---------------------------------------------------------------------------
    const [text, setText] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentCharIndex, setCurrentCharIndex] = useState<number | null>(null);
    const synthRef = useRef<Tone.Synth<Tone.SynthOptions> | null>(null);

    // ---------------------------------------------------------------------------
    // 🎵 INITIALIZE SYNTH
    // ---------------------------------------------------------------------------
    useEffect(() => {
        synthRef.current = new Tone.Synth().toDestination();

        return () => {
            // Ensure cleanup returns void and releases memory
            if (synthRef.current) {
                synthRef.current.dispose();
                synthRef.current = null;
            }
        };
    }, []);

    // ---------------------------------------------------------------------------
    // 🎶 NOTE MAPPING
    // ---------------------------------------------------------------------------
    const noteMap: Record<string, string> = useMemo(
        () => ({
            a: "C4", b: "D4", c: "E4", d: "F4", e: "G4", f: "A4", g: "B4",
            h: "C5", i: "D5", j: "E5", k: "F5", l: "G5", m: "A5", n: "B5",
            o: "C6", p: "D6", q: "E6", r: "F6", s: "G6", t: "A6", u: "B6",
            v: "C3", w: "D3", x: "E3", y: "F3", z: "G3",
        }),
        []
    );

    // ---------------------------------------------------------------------------
    // 🧠 HANDLE INPUT
    // ---------------------------------------------------------------------------
    const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const lastChar = newValue.slice(-1).toLowerCase();

        setText(newValue);

        // Only play sound for valid alphabetic characters
        if (/^[a-zA-Z]$/.test(lastChar) && noteMap[lastChar]) {
            try {
                await Tone.start();
                synthRef.current?.triggerAttackRelease(noteMap[lastChar], "8n");
            } catch (error) {
                console.error("Error playing note:", error);
            }
        }
    };

    // ---------------------------------------------------------------------------
    // ▶️ PLAYBACK FUNCTION WITH SPECIAL CHARACTER LOGIC
    // ---------------------------------------------------------------------------
    const handlePlayback = async () => {
        if (isPlaying || !text.trim()) return;

        setIsPlaying(true);
        setCurrentCharIndex(null);
        await Tone.start();

        // Build playback sequence with durations adjusted for '.' and ','
        const sequence: { index: number; note: string; duration: number }[] = [];
        const chars = text.split("");

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i].toLowerCase();
            const prev = sequence[sequence.length - 1];

            if (noteMap[char]) {
                // Regular letter → short note (0.2s)
                sequence.push({ index: i, note: noteMap[char], duration: 0.2 });
            } else if (char === "." && prev) {
                // Extend previous note to 3s
                prev.duration = 3.0;
            } else if (char === "," && prev) {
                // Extend previous note to 1s
                prev.duration = 1.0;
            }
            // Ignore other characters (spaces, etc.)
        }

        // Play sequence with visual highlight
        const now = Tone.now();
        let cumulativeTime = 0;

        sequence.forEach((item) => {
            const { index, note, duration } = item;
            const startTime = now + cumulativeTime;

            // Schedule sound + highlight
            Tone.Transport.scheduleOnce(() => {
                setCurrentCharIndex(index);
                synthRef.current?.triggerAttackRelease(note, duration);
            }, startTime - now);

            // Add spacing after each note
            cumulativeTime += duration + 0.1;
        });

        Tone.Transport.start();

        // Cleanup and reset state after playback
        const totalDuration = sequence.reduce((sum, n) => sum + n.duration + 0.1, 0);
        setTimeout(() => {
            setIsPlaying(false);
            setCurrentCharIndex(null);
            Tone.Transport.stop();
            Tone.Transport.cancel();
        }, totalDuration * 1000 + 200);
    };

    // ---------------------------------------------------------------------------
    // 🪶 STYLES
    // ---------------------------------------------------------------------------
    const paperStyle = {
        backgroundImage:
            "repeating-linear-gradient(white, white 23px, #d1d5db 24px)",
        backgroundSize: "100% 24px",
        fontFamily: "Comic Sans MS, cursive, sans-serif",
    };

    // ---------------------------------------------------------------------------
    // ✏️ HELPER — Render Highlighted Text
    // ---------------------------------------------------------------------------
    const renderTextWithHighlight = () => {
        return (
            <div
                className="whitespace-pre-wrap wrap-break-word text-lg leading-6 tracking-wide"
                style={paperStyle}
            >
                {text.split("").map((ch, i) => {
                    const isActive = i === currentCharIndex;
                    const isLetter = /^[a-zA-Z]$/.test(ch);
                    const isDot = ch === ".";
                    const isComma = ch === ",";

                    // Different styles for letters vs punctuation
                    return (
                        <span
                            key={i}
                            className={
                                isActive
                                    ? "bg-yellow-200 border-b-2 border-yellow-500 animate-pulse"
                                    : isLetter
                                        ? "text-gray-800"
                                        : isDot || isComma
                                            ? "text-blue-500"
                                            : "text-gray-400"
                            }
                        >
                            {ch || " "}
                        </span>
                    );
                })}
            </div>
        );
    };

    // ---------------------------------------------------------------------------
    // 🧱 RENDER
    // ---------------------------------------------------------------------------
    return (
        <div className="flex flex-col items-center gap-4 p-6 w-full max-w-xl mx-auto">
            <h2 className="text-xl font-semibold">🎵 Musical Sentence Builder</h2>

            {/* Editable Mode */}
            {!isPlaying ? (
                <textarea
                    className="
            w-full min-h-[200px] border border-gray-300 rounded-md p-4
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            text-lg leading-6 tracking-wide
          "
                    style={paperStyle}
                    value={text}
                    onChange={handleChange}
                    placeholder="Type your sentence here..."
                    spellCheck={false}
                />
            ) : (
                // Playback Mode (highlighting)
                <div
                    className="
            w-full min-h-[200px] border border-blue-300 rounded-md p-4
            bg-white text-lg relative overflow-y-auto
          "
                >
                    {renderTextWithHighlight()}
                </div>
            )}

            {/* Playback Button */}
            <Button
                onClick={handlePlayback}
                disabled={isPlaying || !text.trim()}
                className="w-40"
            >
                {isPlaying ? "Playing..." : "▶️ Playback"}
            </Button>

            <p className="text-sm text-gray-500">
                - Each letter plays a note 🎶
                - <b>“.”</b> makes the previous note longer (3s)
                - <b>“,”</b> makes it moderately long (1s)
            </p>
        </div>
    );
}
