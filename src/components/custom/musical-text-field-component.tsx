// app/components/MusicalTextField.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import * as Tone from "tone"; // ✅ Lightweight synth engine for browser sound

/**
 * MusicalTextField
 * A text input styled like a primary school exercise book with musical feedback.
 * - Each alphabet key produces a musical note.
 * - User can play back the sequence as a melody.
 * - Built with Tailwind + ShadCN for styling, optimized for Next.js.
 */
export default function MusicalTextField() {
    // ---------------------------------------------------------------------------
    // 🧩 STATE
    // ---------------------------------------------------------------------------
    const [text, setText] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const synthRef = useRef<Tone.Synth | null>(null);

    // ---------------------------------------------------------------------------
    // 🎵 INITIALIZE SYNTH
    // ---------------------------------------------------------------------------
    useEffect(() => {
        // Create synth once (lazy initialize)
        synthRef.current = new Tone.Synth().toDestination();

        return () => {
            // Cleanup to avoid memory leaks when unmounted
            synthRef.current?.dispose();
        };
    }, []);

    // ---------------------------------------------------------------------------
    // 🎶 NOTE MAPPING
    // ---------------------------------------------------------------------------
    // Map letters to musical notes (A-G major scale, looped)
    const noteMap: Record<string, string> = useMemo(
        () => ({
            a: "C4",
            b: "D4",
            c: "E4",
            d: "F4",
            e: "G4",
            f: "A4",
            g: "B4",
            h: "C5",
            i: "D5",
            j: "E5",
            k: "F5",
            l: "G5",
            m: "A5",
            n: "B5",
            o: "C6",
            p: "D6",
            q: "E6",
            r: "F6",
            s: "G6",
            t: "A6",
            u: "B6",
            v: "C3",
            w: "D3",
            x: "E3",
            y: "F3",
            z: "G3",
        }),
        []
    );

    // ---------------------------------------------------------------------------
    // 🧠 EVENT HANDLER — onChange with Sound
    // ---------------------------------------------------------------------------
    const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const lastChar = newValue.slice(-1).toLowerCase();

        setText(newValue);

        // Only play sound for valid alphabetic characters
        if (/^[a-zA-Z]$/.test(lastChar) && noteMap[lastChar]) {
            try {
                await Tone.start(); // Resume audio context (needed for Chrome autoplay policy)
                synthRef.current?.triggerAttackRelease(noteMap[lastChar], "8n");
            } catch (error) {
                console.error("Error playing note:", error);
            }
        }
    };

    // ---------------------------------------------------------------------------
    // ▶️ PLAYBACK FUNCTION
    // ---------------------------------------------------------------------------
    const handlePlayback = async () => {
        if (isPlaying || !text.trim()) return; // prevent double play or empty play

        setIsPlaying(true);
        await Tone.start();

        // Filter text to only alphabet characters that exist in noteMap
        const validChars = text
            .toLowerCase()
            .split("")
            .filter((ch) => noteMap[ch]);

        // Schedule note playback sequentially
        const now = Tone.now();
        validChars.forEach((char, index) => {
            const time = now + index * 0.3; // 0.3s spacing
            synthRef.current?.triggerAttackRelease(noteMap[char], "8n", time);
        });

        // Reset play state after last note
        setTimeout(() => setIsPlaying(false), validChars.length * 300);
    };

    // ---------------------------------------------------------------------------
    // 🪶 UI STYLES — Exercise Book Look
    // ---------------------------------------------------------------------------
    // Lined paper effect using repeating-linear-gradient
    const paperStyle = {
        backgroundImage:
            "repeating-linear-gradient(white, white 23px, #d1d5db 24px)", // light gray lines
        backgroundSize: "100% 24px",
        fontFamily: "Comic Sans MS, cursive, sans-serif",
    };

    // ---------------------------------------------------------------------------
    // 🧱 RENDER
    // ---------------------------------------------------------------------------
    return (
        <div className="flex flex-col items-center gap-4 p-6 w-full max-w-xl mx-auto">
            <h2 className="text-xl font-semibold">🎵 Musical Sentence Builder</h2>

            {/* Lined TextArea */}
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

            {/* Playback Button */}
            <Button
                onClick={handlePlayback}
                disabled={isPlaying || !text.trim()}
                className="w-40"
            >
                {isPlaying ? "Playing..." : "▶️ Playback"}
            </Button>

            {/* Optional: Instruction / Error Handling */}
            <p className="text-sm text-gray-500">
                Each letter plays a note 🎶. Tap letters to compose and press “Playback”
                to hear your full sentence!
            </p>
        </div>
    );
}
