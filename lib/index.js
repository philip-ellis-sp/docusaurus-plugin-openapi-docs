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
exports.getDocsData = exports.isURL = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("@docusaurus/utils");
const chalk_1 = __importDefault(require("chalk"));
const mustache_1 = require("mustache");
const markdown_1 = require("./markdown");
const openapi_1 = require("./openapi");
const options_1 = require("./options");
const sidebars_1 = __importDefault(require("./sidebars"));
function isURL(str) {
    return /^(https?:)\/\//m.test(str);
}
exports.isURL = isURL;
function getDocsData(dataArray, filter) {
    // eslint-disable-next-line array-callback-return
    const filteredData = dataArray.filter((data) => {
        if (data[0] === filter) {
            return data[1];
        }
        // Search plugin-content-docs instances
        if (data[0] === "@docusaurus/plugin-content-docs") {
            const pluginId = data[1].id ? data[1].id : "default";
            if (pluginId === filter) {
                return data[1];
            }
        }
    })[0];
    if (filteredData) {
        // Search presets, e.g. "classic"
        if (filteredData[0] === filter) {
            return filteredData[1].docs;
        }
        // Search plugin-content-docs instances
        if (filteredData[0] === "@docusaurus/plugin-content-docs") {
            const pluginId = filteredData[1].id ? filteredData[1].id : "default";
            if (pluginId === filter) {
                return filteredData[1];
            }
        }
    }
    return;
}
exports.getDocsData = getDocsData;
function pluginOpenAPIDocs(context, options) {
    const { config, docsPluginId } = options;
    const { siteDir, siteConfig } = context;
    // Get routeBasePath and path from plugin-content-docs or preset
    const presets = siteConfig.presets;
    const plugins = siteConfig.plugins;
    const presetsPlugins = presets.concat(plugins);
    const docData = getDocsData(presetsPlugins, docsPluginId);
    const docRouteBasePath = docData ? docData.routeBasePath : undefined;
    const docPath = docData ? (docData.path ? docData.path : "docs") : undefined;
    async function generateApiDocs(options) {
        let { specPath, outputDir, template, sidebarOptions } = options;
        const contentPath = isURL(specPath)
            ? specPath
            : path_1.default.resolve(siteDir, specPath);
        try {
            const openapiFiles = await (0, openapi_1.readOpenapiFiles)(contentPath, options);
            const [loadedApi, tags] = await (0, openapi_1.processOpenapiFiles)(openapiFiles, sidebarOptions);
            if (!fs_1.default.existsSync(outputDir)) {
                try {
                    fs_1.default.mkdirSync(outputDir, { recursive: true });
                    console.log(chalk_1.default.green(`Successfully created "${outputDir}"`));
                }
                catch (err) {
                    console.error(chalk_1.default.red(`Failed to create "${outputDir}"`), chalk_1.default.yellow(err));
                }
            }
            // TODO: figure out better way to set default
            if (Object.keys(sidebarOptions !== null && sidebarOptions !== void 0 ? sidebarOptions : {}).length > 0) {
                const sidebarSlice = (0, sidebars_1.default)(sidebarOptions, options, loadedApi, tags, docPath);
                const sidebarSliceTemplate = `module.exports = {{{slice}}};`;
                const view = (0, mustache_1.render)(sidebarSliceTemplate, {
                    slice: JSON.stringify(sidebarSlice),
                });
                if (!fs_1.default.existsSync(`${outputDir}/sidebar.js`)) {
                    try {
                        fs_1.default.writeFileSync(`${outputDir}/sidebar.js`, view, "utf8");
                        console.log(chalk_1.default.green(`Successfully created "${outputDir}/sidebar.js"`));
                    }
                    catch (err) {
                        console.error(chalk_1.default.red(`Failed to write "${outputDir}/sidebar.js"`), chalk_1.default.yellow(err));
                    }
                }
            }
            const mdTemplate = template
                ? fs_1.default.readFileSync(template).toString()
                : `---
id: {{{id}}}
{{^api}}
sidebar_label: Introduction
{{/api}}
{{#api}}
sidebar_label: {{{title}}}
{{/api}}
{{^api}}
sidebar_position: 0
{{/api}}
hide_title: true
{{#api}}
hide_table_of_contents: true
{{/api}}
{{#json}}
api: {{{json}}}
{{/json}}
{{#api.method}}
sidebar_class_name: "{{{api.method}}} api-method"
{{/api.method}}
{{#infoPath}}
info_path: {{{infoPath}}}
{{/infoPath}}
---

{{{markdown}}}
      `;
            const infoMdTemplate = `---
id: {{{id}}}
sidebar_label: {{{title}}}
hide_title: true
custom_edit_url: null
---

{{{markdown}}}

\`\`\`mdx-code-block
import DocCardList from '@theme/DocCardList';
import {useCurrentSidebarCategory} from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items}/>
\`\`\`
      `;
            const tagMdTemplate = `---
id: {{{id}}}
title: {{{description}}}
description: {{{description}}}
custom_edit_url: null
---

{{{markdown}}}

\`\`\`mdx-code-block
import DocCardList from '@theme/DocCardList';
import {useCurrentSidebarCategory} from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items}/>
\`\`\`
      `;
            loadedApi.map(async (item) => {
                const markdown = item.type === "api"
                    ? (0, markdown_1.createApiPageMD)(item)
                    : item.type === "info"
                        ? (0, markdown_1.createInfoPageMD)(item)
                        : (0, markdown_1.createTagPageMD)(item);
                item.markdown = markdown;
                if (item.type === "api") {
                    item.json = JSON.stringify(item.api);
                    let infoBasePath = `${outputDir}/${item.infoId}`;
                    if (docRouteBasePath) {
                        infoBasePath = `${docRouteBasePath}/${outputDir
                            .split(docPath)[1]
                            .replace(/^\/+/g, "")}/${item.infoId}`.replace(/^\/+/g, "");
                    }
                    if (item.infoId)
                        item.infoPath = infoBasePath;
                }
                const view = (0, mustache_1.render)(mdTemplate, item);
                const utils = (0, mustache_1.render)(infoMdTemplate, item);
                // eslint-disable-next-line testing-library/render-result-naming-convention
                const tagUtils = (0, mustache_1.render)(tagMdTemplate, item);
                if (item.type === "api") {
                    if (!fs_1.default.existsSync(`${outputDir}/${item.id}.api.mdx`)) {
                        try {
                            fs_1.default.writeFileSync(`${outputDir}/${item.id}.api.mdx`, view, "utf8");
                            console.log(chalk_1.default.green(`Successfully created "${outputDir}/${item.id}.api.mdx"`));
                        }
                        catch (err) {
                            console.error(chalk_1.default.red(`Failed to write "${outputDir}/${item.id}.api.mdx"`), chalk_1.default.yellow(err));
                        }
                    }
                }
                // TODO: determine if we actually want/need this
                if (item.type === "info") {
                    if (!fs_1.default.existsSync(`${outputDir}/${item.id}.info.mdx`)) {
                        try {
                            (sidebarOptions === null || sidebarOptions === void 0 ? void 0 : sidebarOptions.categoryLinkSource) === "info" // Only use utils template if set to "info"
                                ? fs_1.default.writeFileSync(`${outputDir}/${item.id}.info.mdx`, utils, "utf8")
                                : fs_1.default.writeFileSync(`${outputDir}/${item.id}.info.mdx`, view, "utf8");
                            console.log(chalk_1.default.green(`Successfully created "${outputDir}/${item.id}.info.mdx"`));
                        }
                        catch (err) {
                            console.error(chalk_1.default.red(`Failed to write "${outputDir}/${item.id}.info.mdx"`), chalk_1.default.yellow(err));
                        }
                    }
                }
                if (item.type === "tag") {
                    if (!fs_1.default.existsSync(`${outputDir}/${item.id}.tag.mdx`)) {
                        try {
                            fs_1.default.writeFileSync(`${outputDir}/${item.id}.tag.mdx`, tagUtils, "utf8");
                            console.log(chalk_1.default.green(`Successfully created "${outputDir}/${item.id}.tag.mdx"`));
                        }
                        catch (err) {
                            console.error(chalk_1.default.red(`Failed to write "${outputDir}/${item.id}.tag.mdx"`), chalk_1.default.yellow(err));
                        }
                    }
                }
                return;
            });
            return;
        }
        catch (e) {
            console.error(chalk_1.default.red(`Loading of api failed for "${contentPath}"`));
            throw e;
        }
    }
    async function cleanApiDocs(options) {
        const { outputDir } = options;
        const apiDir = path_1.default.join(siteDir, outputDir);
        const apiMdxFiles = await (0, utils_1.Globby)(["*.api.mdx", "*.info.mdx", "*.tag.mdx"], {
            cwd: path_1.default.resolve(apiDir),
            deep: 1,
        });
        const sidebarFile = await (0, utils_1.Globby)(["sidebar.js"], {
            cwd: path_1.default.resolve(apiDir),
            deep: 1,
        });
        apiMdxFiles.map((mdx) => fs_1.default.unlink(`${apiDir}/${mdx}`, (err) => {
            if (err) {
                console.error(chalk_1.default.red(`Cleanup failed for "${apiDir}/${mdx}"`), chalk_1.default.yellow(err));
            }
            else {
                console.log(chalk_1.default.green(`Cleanup succeeded for "${apiDir}/${mdx}"`));
            }
        }));
        sidebarFile.map((sidebar) => fs_1.default.unlink(`${apiDir}/${sidebar}`, (err) => {
            if (err) {
                console.error(chalk_1.default.red(`Cleanup failed for "${apiDir}/${sidebar}"`), chalk_1.default.yellow(err));
            }
            else {
                console.log(chalk_1.default.green(`Cleanup succeeded for "${apiDir}/${sidebar}"`));
            }
        }));
    }
    async function generateVersions(versions, outputDir) {
        let versionsArray = [];
        for (const [version, metadata] of Object.entries(versions)) {
            versionsArray.push({
                version: version,
                label: metadata.label,
                baseUrl: metadata.baseUrl,
            });
        }
        const versionsJson = JSON.stringify(versionsArray, null, 2);
        try {
            fs_1.default.writeFileSync(`${outputDir}/versions.json`, versionsJson, "utf8");
            console.log(chalk_1.default.green(`Successfully created "${outputDir}/versions.json"`));
        }
        catch (err) {
            console.error(chalk_1.default.red(`Failed to write "${outputDir}/versions.json"`), chalk_1.default.yellow(err));
        }
    }
    async function cleanVersions(outputDir) {
        if (fs_1.default.existsSync(`${outputDir}/versions.json`)) {
            fs_1.default.unlink(`${outputDir}/versions.json`, (err) => {
                if (err) {
                    console.error(chalk_1.default.red(`Cleanup failed for "${outputDir}/versions.json"`), chalk_1.default.yellow(err));
                }
                else {
                    console.log(chalk_1.default.green(`Cleanup succeeded for "${outputDir}/versions.json"`));
                }
            });
        }
    }
    return {
        name: `docusaurus-plugin-openapi-docs`,
        extendCli(cli) {
            cli
                .command(`gen-api-docs`)
                .description(`Generates OpenAPI docs in MDX file format and sidebar.js (if enabled).`)
                .usage("<id>")
                .arguments("<id>")
                .action(async (command, instance, args) => {
                if (command !== "gen-api-docs") {
                    return;
                }
                const id = args[0];
                if (id === "all") {
                    if (config[id]) {
                        console.error(chalk_1.default.red("Can't use id 'all' for OpenAPI docs configuration key."));
                    }
                    else {
                        Object.keys(config).forEach(async function (key) {
                            await generateApiDocs(config[key]);
                        });
                    }
                }
                else if (!config[id]) {
                    console.error(chalk_1.default.red(`ID '${id}' does not exist in OpenAPI docs config.`));
                }
                else {
                    await generateApiDocs(config[id]);
                }
            })
                .parseAsync();
            cli
                .command(`gen-api-docs:version`)
                .description(`Generates versioned OpenAPI docs in MDX file format, versions.js and sidebar.js (if enabled).`)
                .usage("<id:version>")
                .arguments("<id:version>")
                .action(async (command, instance, args) => {
                if (command !== "gen-api-docs:version") {
                    return;
                }
                const id = args[0];
                const [parentId, versionId] = id.split(":");
                const parentConfig = Object.assign({}, config[parentId]);
                const version = parentConfig.version;
                const label = parentConfig.label;
                const baseUrl = parentConfig.baseUrl;
                let parentVersion = {};
                parentVersion[version] = { label: label, baseUrl: baseUrl };
                const { versions } = config[parentId];
                const mergedVersions = Object.assign(parentVersion, versions);
                // Prepare for merge
                delete parentConfig.versions;
                delete parentConfig.version;
                delete parentConfig.label;
                delete parentConfig.baseUrl;
                // TODO: handle when no versions are defined by version command is passed
                if (versionId === "all") {
                    if (versions[id]) {
                        console.error(chalk_1.default.red("Can't use id 'all' for OpenAPI docs versions configuration key."));
                    }
                    else {
                        await generateVersions(mergedVersions, parentConfig.outputDir);
                        Object.keys(versions).forEach(async (key) => {
                            const versionConfig = versions[key];
                            const mergedConfig = {
                                ...parentConfig,
                                ...versionConfig,
                            };
                            await generateApiDocs(mergedConfig);
                        });
                    }
                }
                else if (!versions[versionId]) {
                    console.error(chalk_1.default.red(`Version ID '${versionId}' does not exist in OpenAPI docs versions config.`));
                }
                else {
                    const versionConfig = versions[versionId];
                    const mergedConfig = {
                        ...parentConfig,
                        ...versionConfig,
                    };
                    await generateVersions(mergedVersions, parentConfig.outputDir);
                    await generateApiDocs(mergedConfig);
                }
            })
                .parseAsync();
            cli
                .command(`clean-api-docs`)
                .description(`Clears the generated OpenAPI docs MDX files and sidebar.js (if enabled).`)
                .usage("<id>")
                .arguments("<id>")
                .action(async (command, instance, args) => {
                if (command !== "clean-api-docs") {
                    return;
                }
                const id = args[0];
                if (id === "all") {
                    if (config[id]) {
                        console.error(chalk_1.default.red("Can't use id 'all' for OpenAPI docs configuration key."));
                    }
                    else {
                        Object.keys(config).forEach(async function (key) {
                            await cleanApiDocs(config[key]);
                        });
                    }
                }
                else {
                    await cleanApiDocs(config[id]);
                }
            })
                .parseAsync();
            cli
                .command(`clean-api-docs:version`)
                .description(`Clears the versioned, generated OpenAPI docs MDX files, versions.json and sidebar.js (if enabled).`)
                .usage("<id:version>")
                .arguments("<id:version>")
                .action(async (command, instance, args) => {
                if (command !== "clean-api-docs:version") {
                    return;
                }
                const id = args[0];
                const [parentId, versionId] = id.split(":");
                const { versions } = config[parentId];
                const parentConfig = Object.assign({}, config[parentId]);
                delete parentConfig.versions;
                if (versionId === "all") {
                    if (versions[id]) {
                        chalk_1.default.red("Can't use id 'all' for OpenAPI docs versions configuration key.");
                    }
                    else {
                        await cleanVersions(parentConfig.outputDir);
                        Object.keys(versions).forEach(async (key) => {
                            const versionConfig = versions[key];
                            const mergedConfig = {
                                ...parentConfig,
                                ...versionConfig,
                            };
                            await cleanApiDocs(mergedConfig);
                        });
                    }
                }
                else {
                    const versionConfig = versions[versionId];
                    const mergedConfig = {
                        ...parentConfig,
                        ...versionConfig,
                    };
                    await cleanApiDocs(mergedConfig);
                }
            })
                .parseAsync();
        },
    };
}
exports.default = pluginOpenAPIDocs;
pluginOpenAPIDocs.validateOptions = ({ options, validate }) => {
    const validatedOptions = validate(options_1.OptionsSchema, options);
    return validatedOptions;
};
