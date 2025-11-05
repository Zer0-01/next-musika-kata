// app/components/MusicalTextField.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import * as Tone from "tone";

/**
 * 🎵 MedanTeksMuzik
 * Tempat menaip muzik mesra kanak-kanak.
 *
 * Ciri-ciri:
 * - Textarea seperti buku latihan
 * - Setiap huruf yang ditaip menghasilkan bunyi
 * - '.' = sustain 3 saat, ',' = sustain 1 saat
 * - Semasa main balik, aksara disorot
 * - Butang hentikan main balik
 */
export default function MedanTeksMuzik() {
    // ---------------------------------------------------------------------------
    // 🧩 STATE
    // ---------------------------------------------------------------------------
    const [text, setText] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [currentCharIndex, setCurrentCharIndex] = useState<number | null>(null);
    const synthRef = useRef<Tone.Synth<Tone.SynthOptions> | null>(null);

    // ---------------------------------------------------------------------------
    // 🎵 INISIALISASI SYNTH
    // ---------------------------------------------------------------------------
    useEffect(() => {
        synthRef.current = new Tone.Synth().toDestination();

        return () => {
            if (synthRef.current) {
                synthRef.current.dispose();
                synthRef.current = null;
            }
        };
    }, []);

    // ---------------------------------------------------------------------------
    // 🎶 PEMETAAN NOTA
    // ---------------------------------------------------------------------------
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
    // ✏️ PENGENDALI INPUT
    // ---------------------------------------------------------------------------
    const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const lastChar = newValue.slice(-1).toLowerCase();
        setText(newValue);

        if (/^[a-zA-Z]$/.test(lastChar) && noteMap[lastChar]) {
            try {
                await Tone.start();
                synthRef.current?.triggerAttackRelease(noteMap[lastChar], "8n");
            } catch (error) {
                console.error("Ralat semasa memainkan nota:", error);
            }
        }
    };

    // ---------------------------------------------------------------------------
    // ▶️ MAIN BALIK TEKS
    // ---------------------------------------------------------------------------
    const handlePlayback = async () => {
        if (isPlaying || !text.trim()) return;
        setIsPlaying(true);
        setCurrentCharIndex(null);
        await Tone.start();

        const sequence: { index: number; note: string; duration: number }[] = [];
        const chars = text.split("");

        for (let i = 0; i < chars.length; i++) {
            const char = chars[i].toLowerCase();
            const prev = sequence[sequence.length - 1];

            if (noteMap[char]) {
                sequence.push({ index: i, note: noteMap[char], duration: 0.2 });
            } else if (char === "." && prev) {
                prev.duration = 3.0;
            } else if (char === "," && prev) {
                prev.duration = 1.0;
            }
        }

        const now = Tone.now();
        let cumulativeTime = 0;

        sequence.forEach((item) => {
            const { index, note, duration } = item;
            const startTime = now + cumulativeTime;

            Tone.Transport.scheduleOnce(() => {
                setCurrentCharIndex(index);
                synthRef.current?.triggerAttackRelease(note, duration);
            }, startTime - now);

            cumulativeTime += duration + 0.1;
        });

        Tone.Transport.start();

        const totalDuration = sequence.reduce(
            (sum, n) => sum + n.duration + 0.1,
            0
        );

        setTimeout(() => {
            setIsPlaying(false);
            setCurrentCharIndex(null);
            Tone.Transport.stop();
            Tone.Transport.cancel();
        }, totalDuration * 1000 + 200);
    };

    // ---------------------------------------------------------------------------
    // ⏹ HENTIKAN MAIN BALIK
    // ---------------------------------------------------------------------------
    const handleStop = () => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        setIsPlaying(false);
        setCurrentCharIndex(null);
    };

    // ---------------------------------------------------------------------------
    // 📘 GAYA KERTAS LATIHAN
    // ---------------------------------------------------------------------------
    const paperStyle = {
        backgroundImage:
            "repeating-linear-gradient(#fff, #fff 22px, #c7d2fe 23px, #fff 24px)",
        backgroundSize: "100% 24px",
        fontFamily: '"Comic Neue", "Comic Sans MS", cursive',
    };

    // ---------------------------------------------------------------------------
    // 🪶 PAPARKAN TEKS DENGAN SOROTAN
    // ---------------------------------------------------------------------------
    const renderTextWithHighlight = () => (
        <div
            className="whitespace-pre-wrap text-lg leading-6 tracking-wide font-medium"
            style={paperStyle}
        >
            {text.split("").map((ch, i) => {
                const isActive = i === currentCharIndex;
                const isLetter = /^[a-zA-Z]$/.test(ch);
                const isDot = ch === ".";
                const isComma = ch === ",";

                return (
                    <span
                        key={i}
                        className={`transition-all duration-150 ${isActive
                            ? "bg-yellow-200 border-b-2 border-yellow-500 animate-pulse rounded-sm px-0.5"
                            : isLetter
                                ? "text-gray-800"
                                : isDot || isComma
                                    ? "text-pink-500"
                                    : "text-gray-400"
                            }`}
                    >
                        {ch || " "}
                    </span>
                );
            })}
        </div>
    );

    // ---------------------------------------------------------------------------
    // 🧱 PAPARAN UTAMA
    // ---------------------------------------------------------------------------
    return (
        <div className="w-screen h-screen flex items-center justify-center" style={{
            backgroundImage: `
      radial-gradient(circle at 10% 20%, #fcd34d 4px, transparent 0),
      radial-gradient(circle at 80% 10%, #60a5fa 4px, transparent 0),
      radial-gradient(circle at 50% 50%, #f472b6 4px, transparent 0)
    `,
            backgroundSize: "50px 50px",
        }}>
            <div className="flex flex-col items-center gap-5 p-6 w-full max-w-2xl mx-2 md:mx-auto bg-linear-to-b from-violet-500 to-violet-50 rounded-3xl shadow-md border border-indigo-200 ">
                <h2 className="text-2xl font-extrabold text-white drop-shadow-sm">
                    🎹 Muzika Kata
                </h2>
                <p className="text-white text-sm text-center">
                    Taip huruf untuk menghasilkan bunyi!

                </p>

                {/* Kawasan Input */}
                {!isPlaying ? (
                    <textarea
                        className="w-full min-h-[200px] border-2 border-indigo-200 rounded-lg p-4
                     bg-white focus:ring-4 focus:ring-indigo-300 focus:border-transparent
                     text-lg leading-6 tracking-wide shadow-inner transition-all"
                        style={paperStyle}
                        value={text}
                        onChange={handleChange}
                        placeholder="Tulis ayat muzik anda di sini..."
                        spellCheck={false}
                    />
                ) : (
                    <div
                        className="w-full min-h-[200px] border-2 border-indigo-300 rounded-lg p-4 bg-white relative overflow-y-auto shadow-inner"
                    >
                        {renderTextWithHighlight()}
                    </div>
                )}

                {/* Butang */}
                <div className="flex gap-3 mt-2">
                    <Button
                        onClick={handlePlayback}
                        disabled={isPlaying || !text.trim()}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-full text-lg shadow-sm"
                    >
                        ▶️ Main
                    </Button>

                    <Button
                        onClick={handleStop}
                        disabled={!isPlaying}
                        variant="destructive"
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full text-lg shadow-sm"
                    >
                        ⏹ Hentikan
                    </Button>
                </div>

                {/* Seksyen Tip */}
                <div className="mt-3 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg p-3 w-full text-center">
                    💡 Tip: Cuba taip perkataan pendek seperti <b>kucing</b> atau <b>bulan</b> dan dengar ayat anda menjadi muzik!
                </div>
            </div>
        </div>
    );

}
