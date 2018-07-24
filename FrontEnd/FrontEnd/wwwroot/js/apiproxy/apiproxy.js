var apiproxy = (function () {
    var globalLogSwitch = false;
    var totalDataEndpoint = "./data/toc2.json";
    var originEntities = [];
    var nextSubIds = {};
    var outputEntities = {};
    var dictEntities = {};
    var _dictMajorIdEntities = {};
    var _dictFullIdEntities = {};
    var allEntitiesIdList = [];
    var defaultEntityList = [];
    var defaultEntityId = "__default__";
    var getAndUpdateSubId = function (majorId) {
        if (nextSubIds[majorId] == null) {
            nextSubIds[majorId] = 0;
        }
        var currentSubId = nextSubIds[majorId];
        nextSubIds[majorId]++;
        return currentSubId;
    };
    var getFullId = function (majorId, subId) {
        var fullId = majorId + "-" + subId;
        return fullId;
    };
    var getMajorId = function (fullId) {
        var pattern = /(^\w+)-(\w+$)/;
        var tmpRes = pattern.exec(fullId);
        var majorId = tmpRes[1];
        return majorId;
    };
    var getSubId = function (fullId) {
        var pattern = /(^\w+)-(\w+$)/;
        var tmpRes = pattern.exec(fullId);
        var subId = tmpRes[2];
        return subId;
    };
    var convertOriginMethodToDictMethod = function (originMethod) {
        var dictMethod = {};
        var methodName = originMethod["name"];
        if (methodName == null) {
            if (globalLogSwitch) {
                console.warn("Method name field not found, the method is ignored.");
            }
            return;
        }
        dictMethod["url"] = originMethod["url"];
        return [methodName, dictMethod];
    };
    var mergeDictMethod = function (dictMethod1, dictMethod2) {
        if (dictMethod1 == null) return dictMethod2;
        if (dictMethod2 == null) return dictMethod1;
        if (globalLogSwitch) {
            console.log("Merge dictMethod conflict, use dictMethod1.");
        }
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
    var convertOriginEntitiesToDictEntities = function (originEntities) {
        var dictMajorIdEntities = {};
        var dictFullIdEntities = {};
        var recursion = function (originEntities) {
            var currentDictMajorIdEntities = {};
            var currentDictFullIdEntities = {};
            for (var i in originEntities) {
                var originEntity = originEntities[i];
                var id = originEntity["id"];
                var subId = getAndUpdateSubId(id);
                var fullId = getFullId(id, subId);
                var dictMajorIdEntity = {};
                var dictFullIdEntity = {};
                var name = originEntity["name"];
                var url = originEntity["url"];
                var methods = {};//TODO
                var subOriginEntities = originEntity["entities"];
                var subDictEntitiesTmpRes = recursion(subOriginEntities);
                var subDictMajorIdEntities = subDictEntitiesTmpRes[0];
                var subDictFullIdEntities = subDictEntitiesTmpRes[1];
                var relationMajorIdEntities = {};
                var relationFullIdEntities = {};
                for (var subMajorId in subDictMajorIdEntities) {
                    relationMajorIdEntities[subMajorId] = {};
                }
                for (var subFullId in subDictFullIdEntities) {
                    relationFullIdEntities[subFullId] = {};
                }
                dictMajorIdEntity["name"] = name;
                dictFullIdEntity["name"] = name;
                dictMajorIdEntity["url"] = url;
                dictFullIdEntity["url"] = url;
                dictMajorIdEntity["methods"] = methods;
                dictFullIdEntity["methods"] = methods;
                dictMajorIdEntity["relation_entities"] = relationMajorIdEntities;
                dictFullIdEntity["relation_full_id_entities"] = relationFullIdEntities;
                if (currentDictMajorIdEntities[id] == null) currentDictMajorIdEntities[id] = dictMajorIdEntity;
                currentDictFullIdEntities[fullId] = dictFullIdEntity;
                if (dictMajorIdEntities[id] == null) dictMajorIdEntities[id] = dictMajorIdEntity;
                dictFullIdEntities[fullId] = dictFullIdEntity;
            }
            return [currentDictMajorIdEntities, currentDictFullIdEntities];
        };
        recursion(originEntities);
        return [dictMajorIdEntities, dictFullIdEntities];
    };
    var convertOriginEntityToDictEntity = function (originEntity) {
        var id = originEntity["id"];
        if (id == null) {
            if (globalLogSwitch) {
                console.warn("Id field not found, convert originEntity to dictEntity failed.");
            }
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
                if (globalLogSwitch) {
                    console.warn("Relation entity id field not found, the entity is ignored.");
                }
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
        defaultEntity["methods"] = {};
        var relationEntities = ["applications", "channels", "contacts", "devices", "domains", "settings", "shares", "sites", "subscriptions", "team", "users", ];
        defaultEntity["relation_entities"] = relationEntities;
        return defaultEntity;
    }
    $.getJSON(totalDataEndpoint, function (data) {
        originEntities = data;
        dictEntities = getAllLevelDictEntities(originEntities);
        var dictEntitiesTmpRes = convertOriginEntitiesToDictEntities(originEntities);
        _dictMajorIdEntities = dictEntitiesTmpRes[0];
        _dictFullIdEntities = dictEntitiesTmpRes[1];
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

    var getEntityMethods = function (entityId) {
        var entity = getEntity(entityId);
        var methods = entity["methods"];
        return methods;
    };

    var setGlobalLogSwitch = function (status) {
        if (status) globalLogSwitch = true;
        else globalLogSwitch = false;
    };

    return {
        getEntities: getEntities,
        getEntity: getEntity,
        getDefaultEntity: getDefaultEntity,
        getEntityMethods: getEntityMethods,
        setGlobalLogSwitch: setGlobalLogSwitch,
    };
})();