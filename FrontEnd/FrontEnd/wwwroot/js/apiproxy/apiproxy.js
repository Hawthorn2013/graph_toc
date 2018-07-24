var apiproxy = (function () {
    var totalDataEndpoint = "./data/toc2.json";
    var originEntities = [];
    var outputEntities = {};
    var dictEntities = {};
    var allEntitiesIdList = [];
    var defaultEntityList = [];
    var defaultEntityId = "__default__";
    var convertOriginMethodToDictMethod = function (originMethod) {
        var dictMethod = {};
        var methodName = originMethod["name"];
        if (methodName == null) {
            console.warn("Method name field not found, the method is ignored.");
            return;
        }
        dictMethod["url"] = originMethod["url"];
        return [methodName, dictMethod];
    };
    var mergeDictMethod = function (dictMethod1, dictMethod2) {
        if (dictMethod1 == null) return dictMethod2;
        if (dictMethod2 == null) return dictMethod1;
        console.log("Merge dictMethod conflict, use dictMethod1.");
        return dictMethod1;
    };
    var convertOriginMethodsToDictMethods = function (originMethods) {
        var dictMethods = {};
        for (var i in originMethods) {
            var originMethod = originMethods[i];
            var dictMethodTmpRes = convertOriginMethodToDictMethod(originMethod);
            var dictMethodName = dictMethodTmpRes[0];
            var dictMethod = dictMethodTmpRes[1];
            dictMethods[dictMethodName] = mergeDictMethod(dictMethods[dictMethodName], dictMethod);
        }
        return dictMethods;
    };
    var convertOriginEntityToDictEntity = function (originEntity) {
        var id = originEntity["id"];
        if (id == null) {
            console.warn("Id field not found, convert originEntity to dictEntity failed.");
            return;
        }
        var name = originEntity["name"];
        var url = originEntity["url"];
        var originMethods = originEntity["methods"];
        var dictMethods = convertOriginMethodsToDictMethods(originMethods);
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
        dictEntity["dict_methods"] = dictMethods;
        dictEntity["relation_dict_entities"] = relationDictEntities;
        return [id, dictEntity];
    };
    var mergeDictMethods = function (dictMethods1, dictMethods2) {
        if (dictMethods1 == null) return dictMethods2;
        if (dictMethods2 == null) return dictMethods1;
        for (var dictMethodName in dictMethods2) {
            var dictMethod = dictMethods2[dictMethodName];
            dictMethods1[dictMethodName] = mergeDictMethod(dictMethods1[dictMethodName], dictMethod);
        }
        return dictMethods1;
    };
    var mergeDictEntity = function (dictEntity1, dictEntity2) {
        if (dictEntity1 == null) return dictEntity2;
        if (dictEntity2 == null) return dictEntity1;
        var dictMethods1 = dictEntity1["dict_methods"];
        var dictMethods2 = dictEntity2["dict_methods"];
        var dictMethods = mergeDictMethods(dictMethods1, dictMethods2);
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
        dictEntity1["dict_methods"] = dictMethods;
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
        outputEntity["methods"] = dictEntity["dict_methods"];
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
        defaultEntity["id"] = defaultEntityId;
        defaultEntity["name"] = "Default";
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
    
    var getEntity = function (entityId) {
        var entity;
        if (entityId == defaultEntityId) {
            entity = makeDefaultEntity();
        } else {
            entity = outputEntities[entityId]
        }
        return entity;
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