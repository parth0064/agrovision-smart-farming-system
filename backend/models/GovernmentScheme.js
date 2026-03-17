const mongoose = require('mongoose');

const governmentSchemeSchema = mongoose.Schema(
    {
        scheme_name: { type: String, required: true },
        state: { type: String, required: true },
        loss_types: [{ type: String }],
        eligibility: { type: String, required: true },
        benefit: { type: String, required: true },
        application_link: { type: String, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('GovernmentScheme', governmentSchemeSchema);
