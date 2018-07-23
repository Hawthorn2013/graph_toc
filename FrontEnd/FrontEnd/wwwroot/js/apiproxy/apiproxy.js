var apiproxy = (function() {
    var entities = {
        Users: {
            url: "https://developer.microsoft.com/en-us/graph/docs/concepts/azuread-users-concept-overview",
            relation_entities: ["Documents", "Sites", "Tasks", "Meetings", "Contacts", "Email", "Calendar",],
        },
        Groups: {
            url: "https://developer.microsoft.com/en-us/graph/docs/concepts/office365-groups-concept-overview",
            relation_entities: ["Files", "Notes", "Tasks", "Sites", "Conversations", "Calendar",],
        },
    };

    var entitiesList = [];
    for (var entityName in entities) {
        var entity = {};
        entity["name"] = entityName;
        entity["url"] = entities[entityName].url;
        entitiesList.push(entity);
    }

    var getEntities = function() {
        return entitiesList;
    };
    
    var getEntity = function (entityName) {
        return entities[entityName];
    };

    return {
        getEntities: getEntities,
        getEntity: getEntity,
    };
})();