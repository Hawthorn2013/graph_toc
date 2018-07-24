var apiproxy = (function () {
    var totalDataEndpoint = "./data/toc2.json";
    var originEntities = [];
    var outputEntities = {};
    var dictEntities = {};
    var allEntitiesIdList = [];
    var defaultEntityList = [];
    var convertOriginEntityToDictEntity = function (originEntity) {
        var id = originEntity["id"];
        if (id == null) {
            console.warn("Id field not found, convert originEntity to dictEntity failed.");
            return;
        }
        var name = originEntity["name"];
        var url = originEntity["url"];
        var relationOriginEntities = originEntity["entities"];
        var relationDictEntities = {};
        for (var i in relationOriginEntities) {
            var relationOriginEntity = relationOriginEntities[i];
            var relationOriginEntityId = relationOriginEntity["id"];
            if (relationOriginEntityId == null) {
                console.warn("Relation entity id field not found, the entity is ignored.");
                continue;
            }
            relationDictEntities[relationOriginEntityId] = {};
        }
        var dictEntity = {};
        dictEntity["name"] = name;
        dictEntity["url"] = url;
        dictEntity["relation_dict_entities"] = relationDictEntities;
        return [id, dictEntity];
    };
    var mergeDictEntity = function (dictEntity1, dictEntity2) {
        if (dictEntity1 == null) return dictEntity2;
        if (dictEntity2 == null) return dictEntity1;
        var relationDictEntities1 = dictEntity1["relation_dict_entities"];
        var relationDictEntities2 = dictEntity2["relation_dict_entities"];
        if (relationDictEntities1 == null) {
            relationDictEntities1 = relationDictEntities2;
            if (relationDictEntities1 == null) {
                relationDictEntities1 = {};
            }
        }
        else {
            for (var id in relationDictEntities2) {
                relationDictEntities1[id] = {};
            }
        }
        dictEntity1["relation_dict_entities"] = relationDictEntities1;
        return dictEntity1;
    };
    var getCurrentLevelDictEntities = function (originEntities) {
        var currentLevelDictEntities = {};
        for (var i in originEntities) {
            var originEntity = originEntities[i];
            var dictEntityTmpRes = convertOriginEntityToDictEntity(originEntity);
            if (dictEntityTmpRes == null) {
                continue;
            }
            var id = dictEntityTmpRes[0];
            var dictEntity = dictEntityTmpRes[1];
            currentLevelDictEntities[id] = mergeDictEntity(currentLevelDictEntities[id], dictEntity);
        }
        return currentLevelDictEntities;
    };
    var getAllLevelDictEntities = function (originEntities) {
        var allLevelDictEntities = {};
        var recursion = function (originEntities) {
            var currentLevelDictEntities = getCurrentLevelDictEntities(originEntities);
            for (var id in currentLevelDictEntities) {
                var currentLevelDictEntity = currentLevelDictEntities[id];
                allLevelDictEntities[id] = mergeDictEntity(allLevelDictEntities[id], currentLevelDictEntity);
            }
            for (var i in originEntities) {
                var originEntity = originEntities[i];
                var relationOriginEntities = originEntity["entities"];
                recursion(relationOriginEntities);
            }
        }
        recursion(originEntities);
        return allLevelDictEntities;
    };
    var getCurrentLevelList = function (entities) {
        var idList = [];
        for (var id in entities) {
            idList.push(id);
        }
        return idList;
    };
    var convertDictEntityToOutputEntity = function (dictEntity) {
        var outputEntity = {};
        outputEntity["name"] = dictEntity["name"];
        outputEntity["url"] = dictEntity["url"];
        var relationEntities = [];
        for (var relationEntityId in dictEntity["relation_dict_entities"]) {
            relationEntities.push(relationEntityId);
        }
        outputEntity["relation_entities"] = relationEntities;
        return outputEntity;
    };
    var convertDictEntitiesToOutputEntities = function (dictEntities) {
        var outputEntities = {};
        for (var id in dictEntities) {
            var dictEntity = dictEntities[id];
            var outputEntity = convertDictEntityToOutputEntity(dictEntity);
            outputEntities[id] = outputEntity;
        }
        return outputEntities;
    };
    var makeDefaultEntity = function () {
        var defaultEntity = {};
        defaultEntity["id"] = "__default_entity__";
        defaultEntity["name"] = "Default Root";
        defaultEntity["url"] = "https://developer.microsoft.com/zh-cn/graph/docs/concepts/overview";
        var relationEntities = ["applications", "channels", "contacts", "devices", "domains", "settings", "shares", "sites", "subscriptions", "team", "users", ];
        defaultEntity["relation_entities"] = relationEntities;
        return defaultEntity;
    }
    $.getJSON(totalDataEndpoint, function (data) {
        originEntities = data;
        dictEntities = getAllLevelDictEntities(originEntities);
        outputEntities = convertDictEntitiesToOutputEntities(dictEntities);
        defaultEntityList = getCurrentLevelList(dictEntities);
    });

    for (var entityName in outputEntities) {
        var entity = {};
        entity["name"] = entityName;
        entity["url"] = outputEntities[entityName].url;
        allEntitiesIdList.push(entity);
    }

    var getEntities = function() {
        return allEntitiesIdList;
    };
    
    var getEntity = function (entityName) {
        var res = outputEntities[entityName]
        return res;
    };
    
    var getDefaultEntity = function () {
        var defaultEntity = makeDefaultEntity();
        return defaultEntity;
    };

    return {
        getEntities: getEntities,
        getEntity: getEntity,
        getDefaultEntity: getDefaultEntity,
    };
})();