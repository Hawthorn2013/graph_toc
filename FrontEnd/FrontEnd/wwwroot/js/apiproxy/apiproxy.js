var apiproxy = (function () {
    var _globalLogSwitch = false;
    var _retuenEntityMethods = true;
    var _totalDataEndpoint = "./data/toc2.json";
    var _originEntities = [];
    var _nextSubIds = {};
    var _outputMajorIdEntities = {};
    var _dictMajorIdFlatEntities = {};
    var _dictFullIdFlatEntities = {};
    var _entityMajorIds = [];
    var _defaultEntityList = [];
    var _defaultEntityId = "__default__";
    var getAndUpdateSubId = function (majorId) {
        if (_nextSubIds[majorId] == null) {
            _nextSubIds[majorId] = 0;
        }
        var currentSubId = _nextSubIds[majorId];
        _nextSubIds[majorId]++;
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
    var convertOriginMethodsToDictMethods = function (originMethods) {
        var dictMethods = {};
        for (var i in originMethods) {
            var originMethod = originMethods[i];
            var methodName = originMethod["name"];
            var url = originMethod["url"];
            var dictMethod = {};
            dictMethod["url"] = url;
            dictMethods[methodName] = dictMethod
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
                var originMethods = originEntity["methods"];
                var distMethods = convertOriginMethodsToDictMethods(originMethods);
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
                dictMajorIdEntity["dict_methods"] = distMethods;
                dictFullIdEntity["dict_methods"] = distMethods;
                dictMajorIdEntity["relation_entities"] = relationMajorIdEntities;
                dictFullIdEntity["relation_entities"] = relationFullIdEntities;
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
        for (var relationEntityId in dictEntity["relation_entities"]) {
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
        defaultEntity["id"] = _defaultEntityId;
        defaultEntity["name"] = "Default";
        defaultEntity["url"] = "https://developer.microsoft.com/zh-cn/graph/docs/concepts/overview";
        defaultEntity["methods"] = {};
        var relationEntities = ["applications", "channels", "contacts", "devices", "domains", "settings", "shares", "sites", "subscriptions", "team", "users", ];
        defaultEntity["relation_entities"] = relationEntities;
        return defaultEntity;
    }
    var getDictEntityIds = function (dictEntities) {
        var ids = [];
        for (var id in dictEntities) {
            ids.push(id);
        }
        return ids;
    };
    $.getJSON(_totalDataEndpoint, function (data) {
        _originEntities = data;
        var dictEntitiesTmpRes = convertOriginEntitiesToDictEntities(_originEntities);
        _dictMajorIdFlatEntities = dictEntitiesTmpRes[0];
        _dictFullIdFlatEntities = dictEntitiesTmpRes[1];
        _outputMajorIdEntities = convertDictEntitiesToOutputEntities(_dictMajorIdFlatEntities);
        _entityMajorIds = getDictEntityIds(_dictMajorIdFlatEntities);
        _defaultEntityList = getCurrentLevelList(_dictMajorIdFlatEntities);
    });

    var getEntities = function() {
        return _entityMajorIds;
    };
    
    var getEntity = function (entityId) {
        var entity;
        if (entityId == _defaultEntityId) {
            entity = makeDefaultEntity();
        } else {
            entity = _outputMajorIdEntities[entityId]
        }
        if (!_retuenEntityMethods) entity["methods"] = {};
        return entity;
    };
    
    var getDefaultEntity = function () {
        var defaultEntity = makeDefaultEntity();
        if (!_retuenEntityMethods) defaultEntity["methods"] = {};
        return defaultEntity;
    };

    var getEntityMethods = function (entityId) {
        var entity = getEntity(entityId);
        var methods = entity["methods"];
        return methods;
    };

    var setGlobalLogSwitch = function (status) {
        if (status) _globalLogSwitch = true;
        else _globalLogSwitch = false;
    };

    var _setReturnEntityMethods = function (returnEntityMethods) {
        if (returnEntityMethods) _retuenEntityMethods = true;
        else _retuenEntityMethods = false;
    };

    return {
        getEntities: getEntities,
        getEntity: getEntity,
        getDefaultEntity: getDefaultEntity,
        getEntityMethods: getEntityMethods,
        setGlobalLogSwitch: setGlobalLogSwitch,
        _setReturnEntityMethods: _setReturnEntityMethods,
    };
})();