define(["dojo/_base/declare", "dijit/_WidgetBase"],
	function(declare, _WidgetBase){
		return declare([_WidgetBase], {
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

				// As this is not an actual AngularJS app we need to manually add $rootElement.
				angular.module('ngMonkey', []).provider({
					$rootElement:function() {
						this.$get = function() {
							return angular.element(document);
						};
					}
				});

				// Retrieve injector to bootstrap our adapter
				var injector = angular.injector(["ng", 'ngMonkey'].concat(this.$modules));

				// Get our Angular dependencies to bootstrap the adapter
				injector.invoke(["$compile", "$rootScope", function($compile, $rootScope){
					var scopeKey;
					var paramsKey;

					// Delete Dojo or Angular 1.x Adapter specific data from the params.
					delete this.params.$modules;
					delete this.params.template;

					// Create Adapter Scope to use for compiling the DOM element.
					this.scope = $rootScope.$new();
					angular.extend(this.scope, this.params);

					// Add all Angular related data in the Adapter Scope as attribute on the DOM elment for compilation.
					for(scopeKey in this.scope){
						// Delete Dojo or Angular 1.x Adapter specific attributes from the Adapter Scope.
						if(scopeKey !== "data-dojo-props" && this.domNode.attributes[scopeKey]){
							delete this.scope[scopeKey];
							continue;
						}

						if(this.scope.hasOwnProperty(scopeKey) && /^[a-z]/i.test(scopeKey)){
							// Normalize property to attribute scopeKey, and set value.
							this.domNode.setAttribute(scopeKey.split(/(?=[A-Z])/).join("-").toLowerCase(), scopeKey);

							// Listen for changes to params and sync to adapter scope.
							for(paramsKey in this.params){
								this.watch(paramsKey, this._onParamsChange);
							}

							// Listen for changes on the Adapter Scope to bind back to the Dojo parent.
							this.scope.$watch(scopeKey, this._onScopeChange.bind(this, scopeKey));
						}
					}

					// Compile the DOM element
					$compile(this.domNode)(this.scope, function(element, scope){
						// Replace Dojo parsed node with Angular 1.x parsed node
						this.domNode.parentNode.replaceChild(element[0], this.domNode);
						this.domNode = element[0];
					}.bind(this));
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
	}
);