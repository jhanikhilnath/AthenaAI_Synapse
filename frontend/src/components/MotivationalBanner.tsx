import { useMemo } from 'react';

const QUOTES = [
    "The scoreboard only reflects the work you did when the stands were empty.",
    "Train like you are in second, compete like you are in first.",
    "Your body will withstand almost anything; it is your mind you have to convince.",
    "Don't stop when you are tired; stop when you are done.",
    "A champion is simply a contender who refused to stay down.",
    "The difference between the impossible and the possible lies entirely in your daily routine.",
    "Pain is temporary, but the results of pushing through it are permanent.",
    "Sweat is the currency you pay today for the victory you want tomorrow.",
    "You can't outrun a bad diet, and you can't out-train a weak mindset.",
    "Excuses burn zero calories and win zero medals.",
];

// Stable random index for the whole session — re-randomises each hard refresh / login
const SESSION_QUOTE_INDEX = Math.floor(Math.random() * QUOTES.length);

const MotivationalBanner = () => {
    const quote = useMemo(() => QUOTES[SESSION_QUOTE_INDEX], []);

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, hsl(345 55% 45%), hsl(350 80% 74%))',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 20px',
                boxShadow: '0 2px 12px 0 hsl(345 55% 45% / 0.25)',
            }}
        >
            {/* Subtle sparkle dots */}
            <span style={{ marginRight: 10, opacity: 0.85, fontSize: 13 }}>✦</span>
            <p
                style={{
                    color: '#fff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    textAlign: 'center',
                    margin: 0,
                    textShadow: '0 1px 4px hsl(345 55% 30% / 0.35)',
                    lineHeight: 1.4,
                }}
            >
                {quote}
            </p>
            <span style={{ marginLeft: 10, opacity: 0.85, fontSize: 13 }}>✦</span>
        </div>
    );
};

export default MotivationalBanner;
