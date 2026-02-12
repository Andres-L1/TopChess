
// Simple scoring algorithm based on tags and student preferences

export const findBestMatch = (teachers, preferences) => {
    if (!teachers || teachers.length === 0) return null;

    const scores = teachers.map(teacher => {
        let score = 0;
        const tags = teacher.tags || [];
        const style = teacher.teachingStyle || "";

        // 1. Level Matching
        if (preferences.level === 'beginner') {
            if (tags.includes('Beginner') || tags.includes('Kids')) score += 10;
            if (teacher.elo < 2400) score += 5; // Lower ELO might be more approachable
            if (tags.includes('Advanced')) score -= 5;
        } else if (preferences.level === 'advanced') {
            if (tags.includes('Advanced') || tags.includes('Master')) score += 10;
            if (teacher.title === 'GM') score += 5;
            if (tags.includes('Beginner')) score -= 5;
        }

        // 2. Goal Matching
        switch (preferences.goal) {
            case 'tactics':
                if (tags.includes('Tactics') || tags.includes('Attack')) score += 15;
                break;
            case 'openings':
                if (tags.includes('Openings') || tags.includes('Opening Prep')) score += 15;
                break;
            case 'endgame':
                if (tags.includes('Endgame')) score += 15;
                break;
            case 'strategy':
                if (tags.includes('Strategy') || tags.includes('Positional')) score += 15;
                break;
            case 'psychology':
                if (tags.includes('Psychology')) score += 15;
                break;
            default:
                break;
        }

        // 3. Style Matching (Text Analysis fallback)
        if (preferences.style === 'analytical') {
            if (style.toLowerCase().includes('analítica') || style.toLowerCase().includes('profunda')) score += 8;
        } else if (preferences.style === 'dynamic') {
            if (style.toLowerCase().includes('dinámico') || style.toLowerCase().includes('divertido')) score += 8;
        } else if (preferences.style === 'patient') {
            if (style.toLowerCase().includes('paciente') || style.toLowerCase().includes('paso a paso')) score += 8;
        }

        return { ...teacher, matchScore: score };
    });

    // Sort by score desc, then by ELO desc
    scores.sort((a, b) => b.matchScore - a.matchScore || b.elo - a.elo);

    // Return the top match
    return scores[0];
};
