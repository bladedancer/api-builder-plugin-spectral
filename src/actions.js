const {
	Spectral,
	isOpenApiv2,
	isOpenApiv3,
	isAsyncApiv2
} = require('@stoplight/spectral');


/**
 * Action method.
 *
 * @param {object} params - A map of all the parameters passed from the flow.
 * @param {object} options - The additional options provided from the flow
 *	 engine.
 * @param {object} options.pluginConfig - The service configuration for this
 *	 plugin from API Builder config.pluginConfig['api-builder-plugin-pluginName']
 * @param {object} options.logger - The API Builder logger which can be used
 *	 to log messages to the console. When run in unit-tests, the messages are
 *	 not logged.  If you wish to test logging, you will need to create a
 *	 mocked logger (e.g. using `simple-mock`) and override in
 *	 `MockRuntime.loadPlugin`.  For more information about the logger, see:
 *	 https://docs.axway.com/bundle/API_Builder_4x_allOS_en/page/logging.html
 * @example
 * 	Log errors with logger.error('Your error message');
 * @param {*} [options.pluginContext] - The data provided by passing the
 *	 context to `sdk.load(file, actions, { pluginContext })` in `getPlugin`
 *	 in `index.js`.
 * @return {*} The response value (resolves to 'next' output, or if the method
 *	 does not define 'next', the first defined output).
 */
async function lint(params) {
	const { document } = params;
	let { type, rules } = params;
	
	type = type || 'oas';

	if (!document) {
		throw new Error('Missing required parameter: document');
	}

	if (type != 'oas' && type != 'asyncapi') {
		throw new Error(`Invalid value for type: [${type}]`);
	}
	
	const spectral = new Spectral();
	let baserules = '';
	rules = rules || {};

	if (type == 'asyncapi') {
		spectral.registerFormat('asyncapi', isAsyncApiv2);
		baserules = 'spectral:asyncapi';
	} else {
		spectral.registerFormat('oas2', isOpenApiv2);
		spectral.registerFormat('oas3', isOpenApiv3);
		baserules = 'spectral:oas';
	}

	return spectral
		.loadRuleset(baserules)
		.then(() => spectral.mergeRules(rules))
		.then(() => spectral.run(document));
		//.then((res) => { console.log(res); return res; })
}

module.exports = {
	lint
};
