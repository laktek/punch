module.exports = {
	cacheObj: function(body, header) {
		return { "body": body, "options": { "header": header } };
	}
};
