"use strict";
/* ============================================================================
 * Copyright (c) Palo Alto Networks
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * ========================================================================== */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTagDisplayName = exports.processOpenapiFile = exports.processOpenapiFiles = exports.readOpenapiFiles = void 0;
const path_1 = __importDefault(require("path"));
const utils_1 = require("@docusaurus/utils");
const openapi_to_postmanv2_1 = __importDefault(require("@paloaltonetworks/openapi-to-postmanv2"));
const postman_collection_1 = __importDefault(require("@paloaltonetworks/postman-collection"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const kebabCase_1 = __importDefault(require("lodash/kebabCase"));
const index_1 = require("../index");
const createRequestExample_1 = require("./createRequestExample");
const loadAndResolveSpec_1 = require("./utils/loadAndResolveSpec");
/**
 * Convenience function for converting raw JSON to a Postman Collection object.
 */
function jsonToCollection(data) {
    return new Promise((resolve, reject) => {
        let schemaPack = new openapi_to_postmanv2_1.default.SchemaPack({ type: "json", data }, { schemaFaker: false });
        schemaPack.computedOptions.schemaFaker = false;
        schemaPack.convert((_err, conversionResult) => {
            if (!conversionResult.result) {
                return reject(conversionResult.reason);
            }
            return resolve(new postman_collection_1.default.Collection(conversionResult.output[0].data));
        });
    });
}
/**
 * Creates a Postman Collection object from an OpenAPI definition.
 */
async function createPostmanCollection(openapiData) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    // Create copy of openapiData
    const data = (0, cloneDeep_1.default)(openapiData);
    // Including `servers` breaks postman, so delete all of them.
    delete data.servers;
    for (let pathItemObject of Object.values(data.paths)) {
        delete pathItemObject.servers;
        (_a = pathItemObject.get) === null || _a === void 0 ? true : delete _a.servers;
        (_b = pathItemObject.put) === null || _b === void 0 ? true : delete _b.servers;
        (_c = pathItemObject.post) === null || _c === void 0 ? true : delete _c.servers;
        (_d = pathItemObject.delete) === null || _d === void 0 ? true : delete _d.servers;
        (_e = pathItemObject.options) === null || _e === void 0 ? true : delete _e.servers;
        (_f = pathItemObject.head) === null || _f === void 0 ? true : delete _f.servers;
        (_g = pathItemObject.patch) === null || _g === void 0 ? true : delete _g.servers;
        (_h = pathItemObject.trace) === null || _h === void 0 ? true : delete _h.servers;
    }
    return await jsonToCollection(data);
}
function createItems(openapiData, sidebarOptions) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    // TODO: Find a better way to handle this
    let items = [];
    const infoId = (0, kebabCase_1.default)(openapiData.info.title);
    if ((sidebarOptions === null || sidebarOptions === void 0 ? void 0 : sidebarOptions.categoryLinkSource) === "tag") {
        // Only create an tag pages if categoryLinkSource set to tag.
        const tags = (_a = openapiData.tags) !== null && _a !== void 0 ? _a : [];
        // eslint-disable-next-line array-callback-return
        tags
            .filter((tag) => { var _a; return !((_a = tag.description) === null || _a === void 0 ? void 0 : _a.includes("SchemaDefinition")); })
            // eslint-disable-next-line array-callback-return
            .map((tag) => {
            var _a;
            const description = getTagDisplayName(tag.name, (_a = openapiData.tags) !== null && _a !== void 0 ? _a : []);
            const tagId = (0, kebabCase_1.default)(tag.name);
            const tagPage = {
                type: "tag",
                id: tagId,
                unversionedId: tagId,
                title: description !== null && description !== void 0 ? description : "",
                description: description !== null && description !== void 0 ? description : "",
                frontMatter: {},
                tag: {
                    ...tag,
                },
            };
            items.push(tagPage);
        });
    }
    if (openapiData.info.description) {
        // Only create an info page if we have a description.
        const infoPage = {
            type: "info",
            id: infoId,
            unversionedId: infoId,
            title: openapiData.info.title,
            description: openapiData.info.description,
            frontMatter: {},
            securitySchemes: (_b = openapiData.components) === null || _b === void 0 ? void 0 : _b.securitySchemes,
            info: {
                ...openapiData.info,
                tags: openapiData.tags,
                title: (_c = openapiData.info.title) !== null && _c !== void 0 ? _c : "Introduction",
                logo: openapiData.info["x-logo"],
                darkLogo: openapiData.info["x-dark-logo"],
            },
        };
        items.push(infoPage);
    }
    for (let [path, pathObject] of Object.entries(openapiData.paths)) {
        const { $ref, description, parameters, servers, summary, ...rest } = pathObject;
        for (let [method, operationObject] of Object.entries({ ...rest })) {
            const title = (_e = (_d = operationObject.summary) !== null && _d !== void 0 ? _d : operationObject.operationId) !== null && _e !== void 0 ? _e : "Missing summary";
            if (operationObject.description === undefined) {
                operationObject.description =
                    (_g = (_f = operationObject.summary) !== null && _f !== void 0 ? _f : operationObject.operationId) !== null && _g !== void 0 ? _g : "";
            }
            const baseId = operationObject.operationId
                ? (0, kebabCase_1.default)(operationObject.operationId)
                : (0, kebabCase_1.default)(operationObject.summary);
            const servers = (_j = (_h = operationObject.servers) !== null && _h !== void 0 ? _h : pathObject.servers) !== null && _j !== void 0 ? _j : openapiData.servers;
            const security = (_k = operationObject.security) !== null && _k !== void 0 ? _k : openapiData.security;
            // Add security schemes so we know how to handle security.
            const securitySchemes = (_l = openapiData.components) === null || _l === void 0 ? void 0 : _l.securitySchemes;
            // Make sure schemes are lowercase. See: https://github.com/cloud-annotations/docusaurus-plugin-openapi/issues/79
            if (securitySchemes) {
                for (let securityScheme of Object.values(securitySchemes)) {
                    if (securityScheme.type === "http") {
                        securityScheme.scheme = securityScheme.scheme.toLowerCase();
                    }
                }
            }
            let jsonRequestBodyExample;
            const body = (_o = (_m = operationObject.requestBody) === null || _m === void 0 ? void 0 : _m.content) === null || _o === void 0 ? void 0 : _o["application/json"];
            if (body === null || body === void 0 ? void 0 : body.schema) {
                jsonRequestBodyExample = (0, createRequestExample_1.sampleRequestFromSchema)(body.schema);
            }
            // Handle vendor JSON media types
            const bodyContent = (_p = operationObject.requestBody) === null || _p === void 0 ? void 0 : _p.content;
            if (bodyContent) {
                const firstBodyContentKey = Object.keys(bodyContent)[0];
                if (firstBodyContentKey.endsWith("+json")) {
                    const firstBody = bodyContent[firstBodyContentKey];
                    if (firstBody === null || firstBody === void 0 ? void 0 : firstBody.schema) {
                        jsonRequestBodyExample = (0, createRequestExample_1.sampleRequestFromSchema)(firstBody.schema);
                    }
                }
            }
            // TODO: Don't include summary temporarilly
            const { summary, ...defaults } = operationObject;
            const apiPage = {
                type: "api",
                id: baseId,
                infoId: infoId !== null && infoId !== void 0 ? infoId : "",
                unversionedId: baseId,
                title: title,
                description: description !== null && description !== void 0 ? description : "",
                frontMatter: {},
                api: {
                    ...defaults,
                    tags: operationObject.tags,
                    method,
                    path,
                    servers,
                    security,
                    securitySchemes,
                    jsonRequestBodyExample,
                    info: openapiData.info,
                },
            };
            items.push(apiPage);
        }
    }
    return items;
}
/**
 * Attach Postman Request objects to the corresponding ApiItems.
 */
function bindCollectionToApiItems(items, postmanCollection) {
    postmanCollection.forEachItem((item) => {
        const method = item.request.method.toLowerCase();
        const path = item.request.url
            .getPath({ unresolved: true }) // unresolved returns "/:variableName" instead of "/<type>"
            .replace(/:([a-z0-9-_]+)/gi, "{$1}"); // replace "/:variableName" with "/{variableName}"
        const apiItem = items.find((item) => {
            if (item.type === "info" || item.type === "tag") {
                return false;
            }
            return item.api.path === path && item.api.method === method;
        });
        if ((apiItem === null || apiItem === void 0 ? void 0 : apiItem.type) === "api") {
            apiItem.api.postman = item.request;
        }
    });
}
async function readOpenapiFiles(openapiPath, options) {
    if (!(0, index_1.isURL)(openapiPath)) {
        const stat = await fs_extra_1.default.lstat(openapiPath);
        if (stat.isDirectory()) {
            console.warn(chalk_1.default.yellow("WARNING: Loading a directory of OpenAPI definitions is experimental and subject to unannounced breaking changes."));
            // TODO: Add config for inlcude/ignore
            const allFiles = await (0, utils_1.Globby)(["**/*.{json,yaml,yml}"], {
                cwd: openapiPath,
                ignore: utils_1.GlobExcludeDefault,
                deep: 1,
            });
            const sources = allFiles.filter((x) => !x.includes("_category_")); // todo: regex exclude?
            return Promise.all(sources.map(async (source) => {
                // TODO: make a function for this
                const fullPath = path_1.default.join(openapiPath, source);
                const data = (await (0, loadAndResolveSpec_1.loadAndResolveSpec)(fullPath));
                return {
                    source: fullPath,
                    sourceDirName: path_1.default.dirname(source),
                    data,
                };
            }));
        }
    }
    const data = (await (0, loadAndResolveSpec_1.loadAndResolveSpec)(openapiPath));
    return [
        {
            source: openapiPath,
            sourceDirName: ".",
            data,
        },
    ];
}
exports.readOpenapiFiles = readOpenapiFiles;
async function processOpenapiFiles(files, sidebarOptions) {
    const promises = files.map(async (file) => {
        if (file.data !== undefined) {
            const processedFile = await processOpenapiFile(file.data, sidebarOptions);
            const itemsObjectsArray = processedFile[0].map((item) => ({
                ...item,
            }));
            const tags = processedFile[1];
            return [itemsObjectsArray, tags];
        }
        console.warn(chalk_1.default.yellow(`WARNING: the following OpenAPI spec returned undefined: ${file.source}`));
        return [];
    });
    const metadata = await Promise.all(promises);
    const items = metadata
        .map(function (x) {
        return x[0];
    })
        .flat()
        .filter(function (x) {
        // Remove undefined items due to transient parsing errors
        return x !== undefined;
    });
    const tags = metadata
        .map(function (x) {
        return x[1];
    })
        .filter(function (x) {
        // Remove undefined tags due to transient parsing errors
        return x !== undefined;
    });
    return [items, tags];
}
exports.processOpenapiFiles = processOpenapiFiles;
async function processOpenapiFile(openapiData, sidebarOptions) {
    const postmanCollection = await createPostmanCollection(openapiData);
    const items = createItems(openapiData, sidebarOptions);
    bindCollectionToApiItems(items, postmanCollection);
    let tags = [];
    if (openapiData.tags !== undefined) {
        tags = openapiData.tags;
    }
    return [items, tags];
}
exports.processOpenapiFile = processOpenapiFile;
// order for picking items as a display name of tags
const tagDisplayNameProperties = ["x-displayName", "name"];
function getTagDisplayName(tagName, tags) {
    var _a;
    // find the very own tagObject
    const tagObject = (_a = tags.find((tagObject) => tagObject.name === tagName)) !== null && _a !== void 0 ? _a : {
        // if none found, just fake one
        name: tagName,
    };
    // return the first found and filled value from the property list
    for (const property of tagDisplayNameProperties) {
        const displayName = tagObject[property];
        if (typeof displayName === "string") {
            return displayName;
        }
    }
    // always default to the tagName
    return tagName;
}
exports.getTagDisplayName = getTagDisplayName;
