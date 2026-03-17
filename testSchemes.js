const schemasDataset = require('./backend/data/government_schemes.json');

function filterSchemes(input) {
  const { state, district, crop, loss_type } = input;
  return schemasDataset.filter(s => {
    const matchState = s.state.toLowerCase() === "all" || (state && s.state.toLowerCase() === state.toLowerCase());
    const matchDistrict = s.district.toLowerCase() === "all" || (district && s.district.toLowerCase() === district.toLowerCase());
    const matchCrop = s.crop.toLowerCase() === "all" || (crop && s.crop.toLowerCase() === crop.toLowerCase());
    const matchLoss = s.loss_type.toLowerCase() === "all" || (loss_type && s.loss_type.toLowerCase() === loss_type.toLowerCase());
    return matchState && matchDistrict && matchCrop && matchLoss;
  });
}

function runTest(name, input) {
    console.log(`TEST: ${name}`);
    const results = filterSchemes(input);
    console.log(`Results (${results.length}):`);
    results.forEach(r => console.log(` - ${r.scheme_name} (${r.type})`));
    console.log('-----------------------------------');
}

runTest("Maharashtra Pune Wheat Flood", {
    state: "Maharashtra", district: "Pune", crop: "Wheat", loss_type: "Flood"
});

runTest("Bihar Patna Rice Flood", {
    state: "Bihar", district: "Patna", crop: "Rice", loss_type: "Flood"
});

runTest("Karnataka Dharwad corn Drought", {
    state: "Karnataka", district: "Dharwad", crop: "corn", loss_type: "Drought"
});
