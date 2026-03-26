export interface FloatingLeaf {
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    driftX: number;
    opacity: number;
    rotate: number;
}

function seededRandomFactory(seed: number): () => number {
    let state = seed >>> 0;

    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

export function createFloatingLeaves(count: number, seed = 1): FloatingLeaf[] {
    const random = seededRandomFactory(seed);

    return Array.from({ length: count }, () => {
        const duration = 12 + random() * 8;
        return {
            x: random() * 100,
            y: -14 + random() * 22,
            size: 14 + random() * 14,
            delay: -(random() * duration),
            duration,
            driftX: (random() - 0.5) * 18,
            opacity: 0.38 + random() * 0.34,
            rotate: random() * 360
        };
    });
}
