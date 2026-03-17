const calculateCropScore = (land_area, budget, location, season, previous_crop) => {
    const recommendations = {
        'Kharif': 'Rice',
        'Rabi': 'Wheat',
        'Zaid': 'Watermelon'
    };

    let recommended_crop = recommendations[season] || 'Corn';
    let score = 0;

    // season match -> +40
    score += 40;

    // budget fit -> +20
    if (budget > 10000) {
        score += 20;
    } else {
        score += 10;
        recommended_crop = 'Millets';
    }

    // location match -> +20
    if (location) {
        score += 20;
    }

    // crop rotation -> +20
    if (previous_crop && previous_crop !== recommended_crop) {
        score += 20;
    }

    const estimated_profit = Math.floor(budget * 1.5 + land_area * 5000);
    let risk_level = 'Medium';

    if (score >= 80) risk_level = 'Low';
    else if (score < 50) risk_level = 'High';

    return {
        recommended_crop,
        score,
        estimated_profit,
        risk_level
    };
};

module.exports = { calculateCropScore };
