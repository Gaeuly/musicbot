/**
 * Muffin STUDIO - Bre4d777 & prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */

/**
 * Muffin STUDIO - Bre4d777& prayag 
 * https://discord.gg/TRPqseUq32
 * give credits or ill touch you in your dreams
 */
export const filters = {
    // BASS CATEGORY
    bassboost: {
        category: "bass",
        description: "Enhances low frequencies for stronger bass",
        equalizer: [
            { band: 0, gain: 0.6 },
            { band: 1, gain: 0.7 },
            { band: 2, gain: 0.8 },
            { band: 3, gain: 0.55 },
            { band: 4, gain: 0.25 },
            { band: 5, gain: 0 },
            { band: 6, gain: -0.25 },
            { band: 7, gain: -0.45 },
            { band: 8, gain: -0.55 },
            { band: 9, gain: -0.7 },
            { band: 10, gain: -0.3 },
            { band: 11, gain: -0.25 },
            { band: 12, gain: 0 },
            { band: 13, gain: 0 },
            { band: 14, gain: 0 },
        ]
    },
    superbass: {
        category: "bass",
        description: "Extreme bass boost for maximum impact",
        equalizer: [
            { band: 0, gain: 0.8 },
            { band: 1, gain: 0.9 },
            { band: 2, gain: 0.8 },
            { band: 3, gain: 0.6 },
            { band: 4, gain: 0.25 },
            { band: 5, gain: 0 },
            { band: 6, gain: -0.25 },
            { band: 7, gain: -0.5 },
            { band: 8, gain: -0.7 },
            { band: 9, gain: -0.8 },
            { band: 10, gain: -0.5 },
            { band: 11, gain: -0.3 },
            { band: 12, gain: 0 },
            { band: 13, gain: 0 },
            { band: 14, gain: 0 },
        ]
    },
    treblebass: {
        category: "bass",
        description: "Enhanced bass with treble for clarity",
        equalizer: [
            { band: 0, gain: 0.6 },
            { band: 1, gain: 0.67 },
            { band: 2, gain: 0.67 },
            { band: 3, gain: 0 },
            { band: 4, gain: -0.5 },
            { band: 5, gain: 0.15 },
            { band: 6, gain: -0.45 },
            { band: 7, gain: 0.23 },
            { band: 8, gain: 0.35 },
            { band: 9, gain: 0.45 },
            { band: 10, gain: 0.55 },
            { band: 11, gain: 0.6 },
            { band: 12, gain: 0.55 },
            { band: 13, gain: 0 },
        ]
    },
    
    // TEMPO/SPEED CATEGORY
    nightcore: {
        category: "tempo",
        description: "Increased speed and pitch for an energetic feel",
        timescale: { speed: 1.3, pitch: 1.3, rate: 1 }
    },
    doubletime: {
        category: "tempo",
        description: "Increases playback speed",
        timescale: { speed: 1.165 }
    },
    slowmo: {
        category: "tempo",
        description: "Slows down audio for a dramatic effect",
        timescale: { speed: 0.5, pitch: 1.0, rate: 0.8 }
    },
    chipmunk: {
        category: "tempo",
        description: "High-pitched voice effect",
        timescale: { pitch: 1.35, rate: 1.25 }
    },
    daycore: {
        category: "tempo",
        description: "Lowered pitch and slightly increased speed",
        equalizer: [
            { band: 0, gain: 0 },
            { band: 1, gain: 0 },
            { band: 2, gain: 0 },
            { band: 3, gain: 0 },
            { band: 4, gain: 0 },
            { band: 5, gain: 0 },
            { band: 6, gain: 0 },
            { band: 7, gain: 0 },
            { band: 8, gain: -0.25 },
            { band: 9, gain: -0.25 },
            { band: 10, gain: -0.25 },
            { band: 11, gain: -0.25 },
            { band: 12, gain: -0.25 },
            { band: 13, gain: -0.25 },
        ],
        timescale: {
            pitch: 0.63,
            rate: 1.05,
        },
    },
    vaporwave: {
        category: "tempo",
        description: "Slowed down pitch with reverb and tremolo",
        equalizer: [
            { band: 0, gain: 0.3 },
            { band: 1, gain: 0.3 },
        ],
        timescale: { pitch: 0.5 },
        tremolo: { depth: 0.3, frequency: 14 },
    },
    
    // SOUND EFFECTS CATEGORY
    eightD: {
        category: "effects",
        description: "Creates a rotating 3D audio effect",
        rotation: { rotationHz: 0.2 }
    },
    karaoke: {
        category: "effects",
        description: "Reduces vocals for karaoke effect",
        karaoke: { level: 1, monoLevel: 1, filterBand: 220, filterWidth: 100 }
    },
    vibrate: {
        category: "effects",
        description: "Adds vibrato and tremolo effects",
        vibrato: { frequency: 4, depth: 0.75 },
        tremolo: { frequency: 4, depth: 0.75 }
    },
    pitch: {
        category: "effects",
        description: "Extreme pitch increase",
        timescale: { pitch: 3 }
    },
    deepbass: {
        category: "effects",
        description: "Extra deep bass with reduced high frequencies",
        equalizer: [
            { band: 0, gain: 0.9 },
            { band: 1, gain: 0.8 },
            { band: 2, gain: 0.6 },
            { band: 3, gain: 0.3 },
            { band: 4, gain: 0 },
            { band: 5, gain: -0.2 },
            { band: 6, gain: -0.4 },
            { band: 7, gain: -0.6 },
            { band: 8, gain: -0.8 },
            { band: 9, gain: -0.9 },
            { band: 10, gain: -0.9 },
            { band: 11, gain: -0.9 },
            { band: 12, gain: -0.9 },
            { band: 13, gain: -0.9 },
        ]
    },
    
    // GENRE EFFECTS CATEGORY
    pop: {
        category: "genre",
        description: "EQ preset optimized for pop music",
        equalizer: [
            { band: 0, gain: 0.65 },
            { band: 1, gain: 0.45 },
            { band: 2, gain: -0.45 },
            { band: 3, gain: -0.65 },
            { band: 4, gain: -0.35 },
            { band: 5, gain: 0.45 },
            { band: 6, gain: 0.55 },
            { band: 7, gain: 0.6 },
            { band: 8, gain: 0.6 },
            { band: 9, gain: 0.6 },
            { band: 10, gain: 0 },
            { band: 11, gain: 0 },
            { band: 12, gain: 0 },
            { band: 13, gain: 0 },
        ]
    },
    party: {
        category: "genre",
        description: "Enhanced low and mid frequencies for party atmosphere",
        equalizer: [
            { band: 0, gain: -1.16 },
            { band: 1, gain: 0.28 },
            { band: 2, gain: 0.42 },
            { band: 3, gain: 0.5 },
            { band: 4, gain: 0.36 },
            { band: 5, gain: 0 },
            { band: 6, gain: -0.3 },
            { band: 7, gain: -0.21 },
            { band: 8, gain: -0.21 },
        ]
    },
    electronic: {
        category: "genre",
        description: "EQ preset optimized for electronic music",
        equalizer: [
            { band: 0, gain: 0.375 },
            { band: 1, gain: 0.35 },
            { band: 2, gain: 0.125 },
            { band: 5, gain: -0.125 },
            { band: 6, gain: -0.125 },
            { band: 8, gain: 0.25 },
            { band: 9, gain: 0.125 },
            { band: 10, gain: 0.15 },
            { band: 11, gain: 0.2 },
            { band: 12, gain: 0.25 },
            { band: 13, gain: 0.35 },
            { band: 14, gain: 0.4 },
        ]
    },
    rock: {
        category: "genre",
        description: "Enhanced mids and slight bass boost for rock music",
        equalizer: [
            { band: 0, gain: 0.3 },
            { band: 1, gain: 0.25 },
            { band: 2, gain: 0.2 },
            { band: 3, gain: 0.1 },
            { band: 4, gain: 0.05 },
            { band: 5, gain: -0.05 },
            { band: 6, gain: -0.15 },
            { band: 7, gain: -0.1 },
            { band: 8, gain: 0.1 },
            { band: 9, gain: 0.2 },
            { band: 10, gain: 0.15 },
            { band: 11, gain: 0.1 },
            { band: 12, gain: 0.05 },
            { band: 13, gain: 0 },
        ]
    },
    
    // SIMULATION CATEGORY
    radio: {
        category: "simulation",
        description: "Simulates radio broadcast sound",
        equalizer: [
            { band: 0, gain: -0.25 },
            { band: 1, gain: 0.48 },
            { band: 2, gain: 0.59 },
            { band: 3, gain: 0.72 },
            { band: 4, gain: 0.56 },
            { band: 6, gain: -0.24 },
            { band: 8, gain: -0.16 },
        ]
    },
    television: {
        category: "simulation",
        description: "Simulates TV audio quality",
        equalizer: [
            { band: 0, gain: 0 },
            { band: 1, gain: 0 },
            { band: 2, gain: 0 },
            { band: 3, gain: 0 },
            { band: 4, gain: 0 },
            { band: 5, gain: 0 },
            { band: 6, gain: 0 },
            { band: 7, gain: 0.65 },
            { band: 8, gain: 0.65 },
            { band: 9, gain: 0.65 },
            { band: 10, gain: 0.65 },
            { band: 11, gain: 0.65 },
            { band: 12, gain: 0.65 },
            { band: 13, gain: 0.65 },
        ]
    },
    soft: {
        category: "simulation",
        description: "Softens high frequencies for a more relaxed sound",
        equalizer: [
            { band: 0, gain: 0 },
            { band: 1, gain: 0 },
            { band: 2, gain: 0 },
            { band: 3, gain: 0 },
            { band: 4, gain: 0 },
            { band: 5, gain: 0 },
            { band: 6, gain: 0 },
            { band: 7, gain: 0 },
            { band: 8, gain: -0.25 },
            { band: 9, gain: -0.25 },
            { band: 10, gain: -0.25 },
            { band: 11, gain: -0.25 },
            { band: 12, gain: -0.25 },
            { band: 13, gain: -0.25 },
        ]
    },
    
    // QUALITY ENHANCERS
    highquality: {
        category: "quality",
        description: "Enhances audio quality with balanced EQ and dynamics",
        equalizer: [
            { band: 0, gain: 0.1 },
            { band: 1, gain: 0.1 },
            { band: 2, gain: 0.05 },
            { band: 3, gain: 0 },
            { band: 4, gain: 0 },
            { band: 5, gain: -0.05 },
            { band: 6, gain: -0.05 },
            { band: 7, gain: 0 },
            { band: 8, gain: 0.1 },
            { band: 9, gain: 0.1 },
            { band: 10, gain: 0.15 },
            { band: 11, gain: 0.15 },
            { band: 12, gain: 0.2 },
            { band: 13, gain: 0.1 },
        ]
    },
    clarity: {
        category: "quality",
        description: "Enhances mid-range frequencies for vocal clarity",
        equalizer: [
            { band: 0, gain: -0.1 },
            { band: 1, gain: -0.05 },
            { band: 2, gain: 0 },
            { band: 3, gain: 0.1 },
            { band: 4, gain: 0.2 },
            { band: 5, gain: 0.3 },
            { band: 6, gain: 0.3 },
            { band: 7, gain: 0.2 },
            { band: 8, gain: 0.1 },
            { band: 9, gain: 0 },
            { band: 10, gain: 0 },
            { band: 11, gain: 0 },
            { band: 12, gain: 0.1 },
            { band: 13, gain: 0.2 },
        ]
    },
    
    // NEW ADDITIONS
    danceflow: {
        category: "effects",
        description: "Enhanced rhythm and beat for dance music",
        equalizer: [
            { band: 0, gain: 0.6 },
            { band: 1, gain: 0.5 },
            { band: 2, gain: 0.3 },
            { band: 3, gain: 0.2 },
            { band: 4, gain: 0 },
            { band: 5, gain: -0.5 },
            { band: 6, gain: -0.3 },
            { band: 7, gain: -0.2 },
            { band: 8, gain: 0 },
            { band: 9, gain: 0.4 },
            { band: 10, gain: 0.5 },
            { band: 11, gain: 0.4 },
            { band: 12, gain: 0.3 },
            { band: 13, gain: 0.2 },
        ]
    },
    acoustic: {
        category: "genre",
        description: "Optimized for acoustic instruments and vocals",
        equalizer: [
            { band: 0, gain: -0.2 },
            { band: 1, gain: -0.1 },
            { band: 2, gain: 0 },
            { band: 3, gain: 0.2 },
            { band: 4, gain: 0.3 },
            { band: 5, gain: 0.3 },
            { band: 6, gain: 0.2 },
            { band: 7, gain: 0.1 },
            { band: 8, gain: 0.1 },
            { band: 9, gain: 0 },
            { band: 10, gain: -0.1 },
            { band: 11, gain: -0.1 },
            { band: 12, gain: -0.2 },
            { band: 13, gain: -0.2 },
        ]
    }
};

// Helper function to get filters by category
export const getFiltersByCategory = () => {
    const categories = {};
    
    for (const [filterName, filterData] of Object.entries(filters)) {
        const category = filterData.category || "uncategorized";
        
        if (!categories[category]) {
            categories[category] = [];
        }
        
        categories[category].push({
            name: filterName,
            description: filterData.description || ""
        });
    }
    
    return categories;
};

export default filters;
