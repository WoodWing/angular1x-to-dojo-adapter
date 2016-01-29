define(["dojo/_base/declare", "dijit/_WidgetBase"],
	function(declare, _WidgetBase){
		var classObject = declare([_WidgetBase], {
			$modules: null,
			scope: null,

			constructor: function(attrs, domNode){
				var i;
				var attribute;
				var attributeNewName;
				var eventPrefixRegExp = /^on(?=.+?)/;

				// Loop over attributes and convert native event attributes to Angular variant
				for(i=0;i<domNode.attributes.length;i++){
					attribute = domNode.attributes[i];

					// We only need to handler event attributes.
					if(eventPrefixRegExp.test(attribute.name)){
						attributeNewName = attribute.name.replace(eventPrefixRegExp, "ng-");

						// Add 'ng-' event attribute
						attrs[attributeNewName] = attribute.value;
						domNode.setAttribute(attributeNewName, attribute.value);

						// Remove 'on' event attribute
						delete attrs[attribute.name];
						domNode.removeAttribute(attribute.name);
					}
				}
			},

			postCreate: function(){
				this.inherited(arguments);

				// Retrieve injector to bootstrap our adapter
				var injector = window.angular.injector(["ngMonkey"].concat(this.$modules));

				// Get our Angular dependencies to bootstrap the adapter
				injector.invoke(["$compile", "$rootScope", function($compile, $rootScope){
					var i;
					var scopeKey;
					var paramKey;
					var paramValue;
					var paramInterpolationMatches;
					var paramExpressionMatches;
					var interpolationRegExp = /{{[^{}]+}}/g;
					var biDirectionalBindingRegExp = /^[a-z$_][a-z$_0-9]*?$/i;
					var expressionRegExp = /[a-z$_0-9]*/gi;

					// Delete Dojo or Angular 1.x Adapter specific data from the params.
					delete this.params.$modules;
					delete this.params.template;

					// Create Adapter Scope to use for compiling the DOM element.
					this.scope = $rootScope.$new();
					window.angular.extend(this.scope, this.params);

					// Add all Angular related data in the Adapter Scope as attribute on the DOM elment for compilation.
					for(scopeKey in this.scope){
						// Delete Dojo or Angular 1.x Adapter specific attributes from the Adapter Scope.
						if(scopeKey !== "data-dojo-props" && this.domNode.attributes[scopeKey]){
							delete this.scope[scopeKey];
							continue;
						}

						if(this.scope.hasOwnProperty(scopeKey) && /^[a-z]/i.test(scopeKey)){
							// Listen for changes to params and sync to adapter scope.
							for(paramKey in this.params){
								paramValue = this.params[paramKey];

								if(!paramValue) continue;

								paramInterpolationMatches = paramValue.match(interpolationRegExp);

								// Interpolation: attr="{{value}}"
								if(paramInterpolationMatches){
									for(i=0;i<paramInterpolationMatches.length;i++){
										this.watch(paramInterpolationMatches[i].replace(/[{}]/g, ""), this._onParamsChange);
									}
								}
								// Bi-directional binding: attr="value"
								else if(biDirectionalBindingRegExp.test(paramValue)) {
									this.watch(paramValue, this._onParamsChange);
								}
								// Expression: attr="value1 + (value2 * 5)"
								else {
									paramExpressionMatches = paramValue.match(expressionRegExp);
									for(i=0;i<paramExpressionMatches.length;i++){
										this.watch(paramExpressionMatches[i], this._onParamsChange);
									}
								}
							}

							// Listen for changes on the Adapter Scope to bind back to the Dojo parent.
							this.scope.$watch(scopeKey, this._onScopeChange.bind(this, scopeKey));
						}
					}

					// Compile the DOM element
					$compile(this.domNode)(this.scope);
				}.bind(this)]);
			},

			destroy: function(){
				this.inherited(arguments);
				this.scope = null;
			},

			// Changes from Angular 1.x
			// ** Tech Note **: This does not work for mvc.at.to (single backward binding). However
			// mvc.at.from (single forward binding) and mvc.at.both (two-way binding) are working.
			_onScopeChange: function(prop, newValue, oldValue){
				if(newValue === oldValue) { return; }

				this.set(prop, newValue);
			},

			// Changes from Dojo
			_onParamsChange: function(prop, oldValue, newValue){
				if(newValue === oldValue) { return; }

				this.scope[prop] = newValue;

				try{
					this.scope.$digest();
				} catch(e){
					console.info(e);
				}
			}
		});

		// As this is not an actual AngularJS app we need to manually add $rootElement.
		window.angular.module('ngMonkey', ["ng"]).provider({
			$rootElement: function() {
				this.$get = function() {
					return window.angular.element(document);
				};
			}
		});

		classObject.invoke = function invoke(invokeFn, modules){
			if(modules){
				modules = ["ng"].concat(modules);
			} else {
				modules = ["ng"];
			}

			var injector = window.angular.injector(modules);
			injector.invoke(invokeFn);
		};

		return classObject;
	}
);