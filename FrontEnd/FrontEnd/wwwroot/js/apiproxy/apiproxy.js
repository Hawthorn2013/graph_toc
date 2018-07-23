var apiproxy = (function() {
    var getEntities = function() {
        var entities = ["User", "Files", "Messages", "People", "Devices", "Coworkers", "Insights", "Chats",];
        return entities;
    };
    
    var getEntity = function (entityName) {
        var entity = {
            url: "https://developer.microsoft.com/en-us/graph/docs/concepts/overview",
            relation_entities: ["Files", "Messages", "People", "Devices", "Coworkers", "Insights", "Chats",],
        };
        if (entityName == "User") return entity;
        else return {};
    };

    return {
        getEntities: getEntities,
        getEntity: getEntity,
    };
})();