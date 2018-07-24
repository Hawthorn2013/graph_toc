var apiproxy = (function () {
    var totalDataEndpoint = "./data/toc2.json";
    var totalData = {};
    var entities = {};
    var destEntities = {};
    var dfs = function (srcEntities) {
        for (var srcEntityIndex in srcEntities) {
            var srcEntity = srcEntities[srcEntityIndex];
            var id = srcEntity["id"];
            var destEntity = destEntities[id];
            if (destEntity == null) {
                destEntity = {};
                destEntity["relation_entities_dict"] = {};
                destEntities[id] = destEntity;
            }
            var url = srcEntity["url"];
            if (url == null) url = "";
            destEntity["url"] = url;
            var name = srcEntity["name"];
            if (name == null) name = "";
            destEntity["name"] = name;
            var srcRelationEntities = srcEntity["entities"]
            for (var srcRelationEntityIndex in srcRelationEntities) {
                var srcRelationEntity = srcRelationEntities[srcRelationEntityIndex];
                var relationId = srcRelationEntity["id"];
                destEntity["relation_entities_dict"][relationId] = {};
            }
            dfs(srcRelationEntities);
        }
    }
    $.getJSON(totalDataEndpoint, function (data) {
        totalData = data;
        dfs(totalData, entities);
        for (var id in destEntities) {
            var destEntity = destEntities[id];
            var finalEntity = {};
            finalEntity["name"] = destEntity["name"];
            finalEntity["url"] = destEntity["url"];
            var relationEntities = [];
            for (var relationEntityId in destEntity["relation_entities_dict"]) {
                relationEntities.push(relationEntityId);
            }
            finalEntity["relation_entities"] = relationEntities;
            entities[id] = finalEntity;
        }
    });

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
        var res = entities[entityName]
        return res;
    };

    return {
        getEntities: getEntities,
        getEntity: getEntity,
    };
})();