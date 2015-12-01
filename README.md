# angular1x-to-dojo-adapter
Adapter to let Angular 1.x directives work within a Dojo application.
## Install / Setup
To make use of this adapter we will have to install it through Bower first. We can do that with: ```bower install angular1x-to-dojo-adapter```
We will have to load Angular in the Dojo application in which we want to use this adapter. This can be done by adding this line to the HEAD tag of your index.html file (path can be different for our application configuration):
```html
<script type='text/javascript' src="path/to/bower_components/angular/angular.min.js.js"></script>
```
Now we have to tell Dojo where to look for the adapter. We can easily do this by using Dojo's Aliases.
```js
window.dojoConfig = {
    ...
    aliases: [
        ["bower/Angular1xToDojoAdapter", "path/to/bower_components/angular1x-to-dojo-adapter/dist/angular1x-to-dojo-adapter.min"]
    ]
    ...
}
```
## Usage
All 'data-dojo-props' properties of Dojo will be added as attribute binding to the DOM element for Angular to compile. The module of the directive and the module dependencies should be added as a Dojo property names '$modules' in 'data-dojo-props'. The value for this property can be either a single String or an Array of Strings.
##### Use an Angular directive component with data passed from Dojo.
In this example you see that we pass people data to the property/attribute 'people', which is used within the Angular directive component to populate the list with people.
```html
<people-directive data-dojo-type="bower/Angular1xToDojoAdapter"
	data-dojo-props="people: this.peopleData, $modules: 'people'">
</people-directive>
```
##### Use an Angular directive component with events.
In this example we show how to use events which are triggered by Angular but handled in Dojo.
```html
<people-directive data-dojo-type="bower/Angular1xToDojoAdapter"
	data-dojo-props="data: this.peopleData, onClick: this.onClick, $modules: 'people'"
	onclick="this.onClick(event)">
</people-directive>
```
##### Use an Angular directive component with other directives.
Here we added the 'ng-class' directive to add a CSS class when mobile is used. The boolean for the mobile check is retrieved from an Angular controller.
```html
<people-directive data-dojo-type="bower/Angular1xToDojoAdapter"
    ng-class="{mobile: vm.isMobile}"
    ng-controller="PeopleController as vm"
	data-dojo-props="data: vm.peopleData, onClick: this.onClick, $modules: 'people'"
	onclick="this.onClick(event)">
</people-directive>
```
##### Use Angular 'ng-repeat' together with an Angular controller
What this example shows is that it is perfectly fine to use the adapter without an Angular directive component. Here we use a controller which provides data for the Angular repeater to make a list of people.
```html
<div data-dojo-type="bower/Angular1xToDojoAdapter"
    data-dojo-props="$modules: 'people'"
    ng-controller="PeopleController as vm">

    <div ng-repeat="model in vm.peopleData">
        {{model.name}}
    </div>
</div>
```
## FAQ
### Can I use two-way binding with this adapter?
Two-way binding can be achieved by making use of ```dojox.mvc.at```. In 'data-dojo-props' you can add as value ```at(this, myProperty)``` which makes it bind both ways.
### Can I also use Angular declarative syntax in HTML?
Yes, you can use this adapter as wrapper around Angular templating like this:
```html
<div data-dojo-type="bower/Angular1xToDojoAdapter"
    data-dojo-props="$modules: [yourModuleDependenciesHere]">
    <!-- Your Angular templating here. This will be parsed by Angular together with the adapter node -->
</div>
```
