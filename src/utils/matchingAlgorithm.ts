
// Simple scoring algorithm based on tags and student preferences

export const findBestMatch = (teachers, preferences) => {
    if (!teachers || teachers.length === 0) return null;

    // Helper to ensure we have an array
    const toArray = (val) => Array.isArray(val) ? val : (val ? [val] : []);

    const scores = teachers.map(teacher => {
        let score = 0;
        const tags = (teacher.tags || []).map(t => t.toLowerCase());
        const style = (teacher.teachingStyle || "").toLowerCase();
        const desc = (teacher.description || "").toLowerCase();

        // 1. Level Matching
        const levels = toArray(preferences.level);
        levels.forEach(lvl => {
            if (lvl === 'beginner') {
                if (tags.includes('beginner') || tags.includes('kids')) score += 10;
                if (teacher.elo < 2200) score += 5; // Lower ELO might be more approachable
            } else if (lvl === 'intermediate') {
                if (teacher.elo >= 1500 && teacher.elo <= 2200) score += 10;
            } else if (lvl === 'advanced') {
                if (tags.includes('advanced') || tags.includes('master')) score += 10;
                if (teacher.title === 'GM' || teacher.title === 'IM') score += 10;
            }
        });

        // 2. Goal Matching
        const goals = toArray(preferences.goal);
        goals.forEach(goal => {
            const keywords = {
                tactics: ['tactics', 'táctica', 'attack', 'cálculo', 'combinaciones'],
                openings: ['openings', 'aperturas', 'repertorio'],
                endgame: ['endgame', 'finales', 'técnica'],
                strategy: ['strategy', 'estrategia', 'posicional'],
                psychology: ['psychology', 'psicología', 'mental']
            };

            const targetWords = keywords[goal] || [goal];
            if (targetWords.some(w => tags.some(t => t.includes(w)) || desc.includes(w))) {
                score += 15;
            }
        });

        // 3. Style Matching
        const styles = toArray(preferences.style);
        styles.forEach(s => {
            const styleKeywords = {
                analytical: ['analítica', 'profunda', 'estudio'],
                dynamic: ['dinámico', 'divertido', 'práctica'],
                patient: ['paciente', 'comprensivo', 'paso a paso']
            };

            const targetStyles = styleKeywords[s] || [s];
            if (targetStyles.some(w => style.includes(w) || desc.includes(w))) {
                score += 8;
            }
        });

        return { ...teacher, matchScore: score };
    });

    // Sort by score desc, then by ELO desc
    scores.sort((a, b) => b.matchScore - a.matchScore || b.elo - a.elo);

    // Return the top match
    return scores[0];
};
