var module_utils = require("../../lib/utils/module_utils.js");

describe("require and setup", function() {

	var sampleConfig = {};

	beforeEach(function() {
		spyOn(process, "cwd").andReturn("/current/path");
	});

	it("locate local modules relative to current working directory", function() {
		spyOn(module_utils, "wrappedRequire").andCallFake(function(path) {
				return {}
		});

		module_utils.requireAndSetup("./modules/local_module", sampleConfig);
		expect(module_utils.wrappedRequire).toHaveBeenCalledWith("/current/path/modules/local_module");
	});

	it("try to locate required module from the current working directory's node modules", function() {
		spyOn(module_utils, "wrappedRequire").andCallFake(function(path) {
				return {}
		});

		module_utils.requireAndSetup("custom_module", sampleConfig);
		expect(module_utils.wrappedRequire).toHaveBeenCalledWith("/current/path/node_modules/custom_module");
	});

	it("traverse till to top of the tree, looking for the module in each node modules directory", function() {
		spyOn(module_utils, "wrappedRequire").andCallFake(function(path) {
			if (path === "/current/node_modules/custom_module") {
				return {}
			} else {
				throw("module not found");
			}
		});

		module_utils.requireAndSetup("custom_module", sampleConfig);
		expect(module_utils.wrappedRequire).toHaveBeenCalledWith("/current/node_modules/custom_module");
	});

	it("delegate module loading to node's paths, if module cannot be found in current working tree", function() {
		spyOn(module_utils, "wrappedRequire").andCallFake(function(path) {
			if (path === "custom_module") {
				return {}
			} else {
				throw("module not found");
			}
		});

		module_utils.requireAndSetup("custom_module", sampleConfig);
		expect(module_utils.wrappedRequire).toHaveBeenCalledWith("custom_module");
	});

	it("call the setup function of the loaded module", function() {
		var spySetup = jasmine.createSpy();

		spyOn(module_utils, "wrappedRequire").andCallFake(function(path) {
				return { "setup": spySetup };
		});

		module_utils.requireAndSetup("./local_module", sampleConfig);
		expect(spySetup).toHaveBeenCalledWith(sampleConfig);
	});


});


