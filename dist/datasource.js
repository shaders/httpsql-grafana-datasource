'use strict';

System.register([], function (_export, _context) {
	"use strict";

	var _createClass, DEFAULT, HttpsqlDatasource;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	return {
		setters: [],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			DEFAULT = '* select *';

			_export('HttpsqlDatasource', HttpsqlDatasource = function () {
				function HttpsqlDatasource(instanceSettings, $q, backendSrv, templateSrv) {
					_classCallCheck(this, HttpsqlDatasource);

					this.type = instanceSettings.type;
					this.url = instanceSettings.url;
					this.name = instanceSettings.name;
					this.q = $q;
					this.backendSrv = backendSrv;
					this.templateSrv = templateSrv;
					this.withCredentials = instanceSettings.withCredentials;
					this.headers = { 'Content-Type': 'application/json' };
					if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) this.headers['Authorization'] = instanceSettings.basicAuth;

					this.metricParamList = {};
				}

				_createClass(HttpsqlDatasource, [{
					key: 'query',
					value: function query(options) {
						var _this = this;

						var from = options.range && options.range.from && new Date(options.range.from).getTime();
						var to = options.range && options.range.to && new Date(options.range.to).getTime();

						var target_list = options.targets.filter(function (target) {
							return target.alias && target.alias != DEFAULT && target.metric && target.metric != DEFAULT && !target.hide;
						});
						if (target_list.length == 0) return Promise.resolve({ data: [] });

						var self = this;
						var url_list = target_list.map(function (target) {

							var paramList = ["appcode", "account", "sso", "platform"];
							var params = paramList.map(function (p) {
								var value = self.templateSrv.replace('$' + p, options.scopedVars, 'regex');
								return p + '=' + (value || '');
							}).join('&') || '';
							return '/' + target.alias + '/' + target.metric + '?' + params + '&from=' + (target.from || from) + '&to=' + (target.to || to) + '&json';
						});

						var scope = url_list.map(function (url) {
							return _this.doRequest(url);
						});

						return Promise.all(scope).then(function (results) {
							var data = [];

							results.forEach(function (result, i) {
								var resArray = result.data || [];
								if (resArray.length == 0) return;

								var target = target_list[i];

								//resArray is array of multiple timelines for timeseries
								resArray.forEach(function (res, i) {
									if (target.datatype == 'table') {
										// should have res as: [{"column1":"value", "column2": "value2"},...]
										var columns = Object.keys(res[0]);
										data.push({
											columns: columns.map(function (c) {
												return new Object({ text: c, type: c.indexOf('time') != -1 ? 'time' : 'string' });
											}),
											rows: res.map(function (e, i) {
												return columns.map(function (c) {
													return res[i][c];
												});
											}),
											type: 'table'
										});
									} else {
										// should have res as: {"target":"seriesName", "datapoints":[[value, time],...]}
										data.push({
											target: res.target,
											datapoints: res.datapoints,
											type: 'timeserie'
										});
									}
								});
							});

							return Promise.resolve({ data: data });
						});
					}
				}, {
					key: 'testDatasource',
					value: function testDatasource() {
						return this.doRequest('/').then(function (res) {
							return res.status == 200 ? { status: 'success', message: 'OK', title: 'Success' } : { status: 'error', message: 'Fail', title: 'Error' };
						});
					}
				}, {
					key: 'getAliasList',
					value: function getAliasList() {
						return this.doRequest('/').then(function (res) {
							return res.data;
						});
					}
				}, {
					key: 'getMetricList',
					value: function getMetricList(alias) {
						if (alias == DEFAULT) return Promise.resolve([]);

						var self = this;
						return this.doRequest('/' + alias).then(function (res) {
							var metrics = res.data;
							for (var metric in metrics) {
								if (!self.metricParamList[metric]) {
									var desc = metrics[metric] || '';
									self.metricParamList[metric] = desc.substring(desc.indexOf(':') + 1, desc.indexOf('.')).split(',').map(function (e) {
										return e.trim();
									});
								}
							}
							return Object.keys(metrics);
						});
					}
				}, {
					key: 'getMetricParamList',
					value: function getMetricParamList(metric) {
						return this.metricParamList[metric] || [];
					}
				}, {
					key: 'doRequest',
					value: function doRequest(url) {
						var options = {
							url: this.url + url,
							withCredentials: this.withCredentials,
							headers: this.headers,
							method: 'GET'
						};

						return this.backendSrv.datasourceRequest(options);
					}
				}]);

				return HttpsqlDatasource;
			}());

			_export('HttpsqlDatasource', HttpsqlDatasource);
		}
	};
});
//# sourceMappingURL=datasource.js.map
