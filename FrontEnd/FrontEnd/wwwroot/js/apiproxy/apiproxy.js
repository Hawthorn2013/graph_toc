var apiproxy = (function () {
    var _defaultTocJsonEndpoint = "./data/toc3.json";
    var _defaultInstance;
    var _buildNewInstance = function (tocJsonEndpoint) {
        var _initFinished = false;
        var _globalLogSwitch = false;
        var _retuenEntityMethods = true;
        var _tocJsonEndpoint = tocJsonEndpoint;
        var _originEntities = [];
        var _nextSubIds = {};
        var _outputMajorIdEntities = {};
        var _dictMajorIdFlatEntities = {};
        var _dictFullIdFlatEntities = {};
        var _dictMajorIdTreeEntities = {};
        var _dictFullIdTreeEntities = {};
        var _dictDefaultToMajorIdEntityPaths = {};
        var _entityMajorIds = [];
        var _defaultEntityList = [];
        var _defaultEntityId = "__default__";
        var _defaultEntities = {};
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
            var dictMajorIdFlatEntities = {};
            var dictFullIdFlatEntities = {};
            var dictDefaultToMajorIdEntityPaths = {};
            var addMajorIdPathToPathes = function (majorId, path) {
                if (dictDefaultToMajorIdEntityPaths[majorId] == null) {
                    dictDefaultToMajorIdEntityPaths[majorId] = [];
                }
                var pathCopy = JSON.parse(JSON.stringify(path));
                dictDefaultToMajorIdEntityPaths[majorId].push(pathCopy);
            };
            var majorIdPath = [];
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
                    majorIdPath.push(id);
                    addMajorIdPathToPathes(id, majorIdPath);
                    var subDictEntitiesTmpRes = recursion(subOriginEntities);
                    majorIdPath.pop();
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
                    var dictMajorIdTreeEntity = JSON.parse(JSON.stringify(dictMajorIdEntity));
                    var dictFullIdTreeEntity = JSON.parse(JSON.stringify(dictFullIdEntity));
                    dictMajorIdEntity["relation_entities"] = relationMajorIdEntities;
                    dictFullIdEntity["relation_entities"] = relationFullIdEntities;
                    dictMajorIdTreeEntity["relation_entities"] = subDictMajorIdEntities;
                    dictFullIdTreeEntity["relation_entities"] = subDictFullIdEntities;
                    if (currentDictMajorIdEntities[id] == null) currentDictMajorIdEntities[id] = dictMajorIdTreeEntity;
                    currentDictFullIdEntities[fullId] = dictFullIdTreeEntity;
                    if (dictMajorIdFlatEntities[id] == null) dictMajorIdFlatEntities[id] = dictMajorIdEntity;
                    dictFullIdFlatEntities[fullId] = dictFullIdEntity;
                }
                return [currentDictMajorIdEntities, currentDictFullIdEntities];
            };
            majorIdPath.push(_defaultEntityId);
            addMajorIdPathToPathes(_defaultEntityId, majorIdPath);
            var dictTreeEntitiesTmpRes = recursion(originEntities);
            majorIdPath.pop();
            var dictMajorIdTreeEntities = dictTreeEntitiesTmpRes[0];
            var dictFullIdTreeEntities = dictTreeEntitiesTmpRes[1];
            return [dictMajorIdFlatEntities, dictFullIdFlatEntities, dictMajorIdTreeEntities, dictFullIdTreeEntities, dictDefaultToMajorIdEntityPaths];
        };
        var getDictEntitiesCurrentLevelIdsList = function (dictEntities) {
            var ids = [];
            for (var id in dictEntities) {
                ids.push(id);
            }
            return ids;
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
            defaultEntity["name"] = "Graph API";
            defaultEntity["url"] = "https://developer.microsoft.com/zh-cn/graph/docs/concepts/overview";
            defaultEntity["methods"] = {};
            var relationEntities = _defaultEntities[_defaultEntityId];
            defaultEntity["relation_entities"] = relationEntities;
            return defaultEntity;
        }

        var getEntities = function () {
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

        var getPaths = function (entityId) {
            var paths = _dictDefaultToMajorIdEntityPaths[entityId];
            return paths;
        };

        var _getFilteredPaths = function (pathNumCondition, entityNumCondition) {
            var filteredDictDefaultToMajorIdEntityPaths = {};
            for (var id in _dictDefaultToMajorIdEntityPaths) {
                var curPaths = _dictDefaultToMajorIdEntityPaths[id];
                var selectedCurPaths = [];
                for (var i in curPaths) {
                    var path = curPaths[i];
                    if (entityNumCondition(path.length)) selectedCurPaths.push(path);
                }
                if (pathNumCondition(selectedCurPaths.length)) filteredDictDefaultToMajorIdEntityPaths[id] = selectedCurPaths;
            }
            return filteredDictDefaultToMajorIdEntityPaths;
        }

        var _setGlobalLogSwitch = function (status) {
            if (status) _globalLogSwitch = true;
            else _globalLogSwitch = false;
        };

        var _setReturnEntityMethods = function (returnEntityMethods) {
            if (returnEntityMethods) _retuenEntityMethods = true;
            else _retuenEntityMethods = false;
        };

        var parseTocJson = function (data) {
            _originEntities = data;
            var dictEntitiesTmpRes = convertOriginEntitiesToDictEntities(_originEntities);
            _dictMajorIdFlatEntities = dictEntitiesTmpRes[0];
            _dictFullIdFlatEntities = dictEntitiesTmpRes[1];
            _dictMajorIdTreeEntities = dictEntitiesTmpRes[2];
            _dictFullIdTreeEntities = dictEntitiesTmpRes[3];
            _dictDefaultToMajorIdEntityPaths = dictEntitiesTmpRes[4];
            _outputMajorIdEntities = convertDictEntitiesToOutputEntities(_dictMajorIdFlatEntities);
            _entityMajorIds = getDictEntitiesCurrentLevelIdsList(_dictMajorIdFlatEntities);
            _defaultEntityList = getDictEntitiesCurrentLevelIdsList(_dictMajorIdFlatEntities);
            _initFinished = true;
        };

        var tocJson = {};
        $.ajaxSettings.async = false;
        $.getJSON(_tocJsonEndpoint, function (data) {
            tocJson = data;
        });
        parseTocJson(tocJson);
        _defaultEntities["__default__"] = ["groups", "me", "users",];
        _defaultEntities["__default_all_top_level__"] = _entityMajorIds;

        return {
            getEntities: getEntities,
            getEntity: getEntity,
            getDefaultEntity: getDefaultEntity,
            getEntityMethods: getEntityMethods,
            getPaths: getPaths,
            _setGlobalLogSwitch: _setGlobalLogSwitch,
            _setReturnEntityMethods: _setReturnEntityMethods,
            _getFilteredPaths: _getFilteredPaths,
        };
    };
    _defaultInstance = new _buildNewInstance(_defaultTocJsonEndpoint);
    _defaultInstance["_buildNewInstance"] = _buildNewInstance;
    return _defaultInstance;
})();