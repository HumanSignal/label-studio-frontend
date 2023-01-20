Contains all the supported tags, their controllers and the registry.

Every tag inherits the Base tag that provides the common functionality and attributes.

Tags are split into two categories:
  - Object tags: These tags are used to create objects in the scene.
  - Control tags: These tags are used to control the corresponding object tags.

The tags are registered in the TagRegistry. The registry is used to create the tags from the XML config.

Tags communicate to each other using the CommunicationBus – internal event-based system.

### Registry

Registry holds the information about availbale tags and their controllers.
