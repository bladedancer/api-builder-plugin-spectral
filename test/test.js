const { expect } = require('chai');
const { MockRuntime } = require('@axway/api-builder-test-utils');
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const getPlugin = require('../src');


function loadAPIDefinition(name) {
	const content = fs.readFileSync(
		path.resolve(__dirname, 'apidefinitions', name), 
		'utf8');

	return YAML.parse(content);
}

describe('flow-node spectral', () => {
	let plugin;
	let flowNode;
	const documents = {};

	before(async () => {
		documents['greet.json'] = loadAPIDefinition('greet.json');
		documents['greet-unlint.json'] = loadAPIDefinition('greet-unlint.json');
		documents['streetlights.yaml'] = loadAPIDefinition('streetlights.yaml');

	})
	beforeEach(async () => {
		plugin = await MockRuntime.loadPlugin(getPlugin);
		flowNode = plugin.getFlowNode('spectral');
	});

	describe('#constructor', () => {
		it('should define flow-nodes', () => {
			expect(plugin).to.be.a('object');
			expect(plugin.getFlowNodeIds()).to.deep.equal([
				'spectral'
			]);
			expect(flowNode).to.be.a('object');

			// Ensure the flow-node matches the spec
			expect(flowNode.name).to.equal('Spectral');
			expect(flowNode.description).to.equal('Use Stoplight Spectral to perform OAS linting.');
			expect(flowNode.icon).to.be.a('string');
			expect(flowNode.getMethods()).to.deep.equal([
				'lint'
			]);
		});

		// It is vital to ensure that the generated node flow-nodes are valid
		// for use in API Builder. Your unit tests should always include this
		// validation to avoid potential issues when API Builder loads your
		// node.
		it('should define valid flow-nodes', () => {
			// if this is invalid, it will throw and fail
			plugin.validate();
		});
	});

	describe('#lint', () => {
		it('should error when missing required parameter', async () => {
			// Invoke #lint with a non-number and check error.
			const { value, output } = await flowNode.lint({
				document: null
			});

			expect(value).to.be.instanceOf(Error)
				.and.to.have.property('message', 'Missing required parameter: document');
			expect(output).to.equal('error');
		});

		it('should default to linting OAS', async () => {
			const document = documents['greet.json'];
			const { value, output } = await flowNode.lint({ document });
			expect(value).to.be.empty;
			expect(output).to.equal('next');
		}).timeout(5000);

		it('should report linting issues in OAS', async () => {
			const document = documents['greet-unlint.json'];
			const { value, output } = await flowNode.lint({ document });
			expect(value).to.not.be.empty;
			expect(value).to.be.length(1);
			expect(value[0].code).to.equal('operation-description');
			expect(value[0].message).to.equal('Operation `description` must be present and non-empty string.');
			expect(output).to.equal('next');
		}).timeout(5000);

		it('should allow custom rules when linting', async () => {
			const document = documents['greet-unlint.json'];
			const rules = {
				"operation-description": {
					severity: -1
				}
			};
			const { value, output } = await flowNode.lint({ 
				document,
				type: 'oas',
				rules
			});
			expect(value).to.be.empty;
			expect(output).to.equal('next');
		}).timeout(5000);

		it('should lint AsyncAPI', async () => {
			const document = documents['streetlights.yaml'];
			const { value, output } = await flowNode.lint({
				document,
				type: 'asyncapi'
			});
			expect(value).to.be.empty;
			expect(output).to.equal('next');
		}).timeout(5000);
	});
});
