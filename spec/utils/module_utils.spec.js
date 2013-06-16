var ModuleUtils = require("../../lib/utils/module_utils");

var pathConv = require("path");
describe("require and setup", function() {

	var sampleConfig = {};

	beforeEach(function() {
		spyOn(process, "cwd").andReturn(pathConv.join("/current/path"));
	});

	it("locate local modules relative to current working directory", function() {
		spyOn(ModuleUtils, "wrappedRequire").andCallFake(function(path) {
				return {}
		});

		ModuleUtils.requireAndSetup("./modules/local_module", sampleConfig);
		expect(ModuleUtils.wrappedRequire).toHaveBeenCalledWith(pathConv.join("/current/path/modules/local_module"));
	});

	it("try to locate required module from the current working directory's node modules", function() {
		spyOn(ModuleUtils, "wrappedRequire").andCallFake(function(path) {
				return {}
		});

		ModuleUtils.requireAndSetup("custom_module", sampleConfig);
		expect(ModuleUtils.wrappedRequire).toHaveBeenCalledWith(pathConv.join("/current/path/node_modules/custom_module"));
	});

	it("traverse till to top of the tree, looking for the module in each node modules directory", function() {
		spyOn(ModuleUtils, "wrappedRequire").andCallFake(function(path) {
			if (path === pathConv.join("/current/node_modules/custom_module")) {
				return {}
			} else {
				throw("module not found");
			}
		});

		ModuleUtils.requireAndSetup("custom_module", sampleConfig);
		expect(ModuleUtils.wrappedRequire).toHaveBeenCalledWith(pathConv.join("/current/node_modules/custom_module"));
	});

	it("delegate module loading to node's paths, if module cannot be found in current working tree", function() {
		spyOn(ModuleUtils, "wrappedRequire").andCallFake(function(path) {
			if (path === "custom_module") {
				return {}
			} else {
				throw("module not found");
			}
		});

		ModuleUtils.requireAndSetup("custom_module", sampleConfig);
		expect(ModuleUtils.wrappedRequire).toHaveBeenCalledWith("custom_module");
	});

	it("call the setup function of the loaded module", function() {
		var spySetup = jasmine.createSpy();

		spyOn(ModuleUtils, "wrappedRequire").andCallFake(function(path) {
				return { "setup": spySetup };
		});

		ModuleUtils.requireAndSetup("./local_module", sampleConfig);
		expect(spySetup).toHaveBeenCalledWith(sampleConfig);
	});


});


