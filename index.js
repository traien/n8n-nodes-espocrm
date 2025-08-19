// Entry point for n8n community node package
// Exposes node and credential classes from the built dist/ output

const { EspoCRM } = require('./dist/nodes/EspoCrm/EspoCrm.node.js');
const { EspoCRMTrigger } = require('./dist/nodes/EspoCrmTrigger/EspoCrmTrigger.node.js');

module.exports = {
	nodeTypes: {
		// Must match the `name` field in the node description
		espoCrm: EspoCRM,
		espoCrmTrigger: EspoCRMTrigger,
	},
	credentialTypes: {
		// Must match the `name` field defined in the credential class
		espoCRMApi: require('./dist/credentials/EspoCrmApi.credentials.js').EspoCrmApi,
	},
};

