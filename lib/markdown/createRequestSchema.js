"use strict";
/* ============================================================================
 * Copyright (c) Palo Alto Networks
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * ========================================================================== */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestSchema = exports.mergeAllOf = void 0;
const createDescription_1 = require("./createDescription");
const createDetails_1 = require("./createDetails");
const createDetailsSummary_1 = require("./createDetailsSummary");
const schema_1 = require("./schema");
const utils_1 = require("./utils");
const jsonSchemaMergeAllOf = require("json-schema-merge-allof");
/**
 * Returns a merged representation of allOf array of schemas.
 */
function mergeAllOf(allOf) {
    const mergedSchemas = jsonSchemaMergeAllOf(allOf, {
        resolvers: {
            readOnly: function () {
                return true;
            },
            example: function () {
                return true;
            },
            ignoreAdditionalProperties: true,
        },
    });
    const required = allOf.reduce((acc, cur) => {
        if (Array.isArray(cur.required)) {
            const next = [...acc, ...cur.required];
            return next;
        }
        return acc;
    }, []);
    return { mergedSchemas, required };
}
exports.mergeAllOf = mergeAllOf;
/**
 * For handling nested anyOf/oneOf.
 */
function createAnyOneOf(schema) {
    const type = schema.oneOf ? "oneOf" : "anyOf";
    return (0, utils_1.create)("li", {
        children: [
            (0, utils_1.create)("div", {
                children: [
                    (0, utils_1.create)("span", {
                        className: "badge badge--info",
                        children: type,
                    }),
                    (0, utils_1.create)("SchemaTabs", {
                        children: schema[type].map((anyOneSchema, index) => {
                            const label = anyOneSchema.title
                                ? anyOneSchema.title
                                : `MOD${index + 1}`;
                            const anyOneChildren = [];
                            if (anyOneSchema.properties !== undefined) {
                                anyOneChildren.push(createProperties(anyOneSchema));
                            }
                            if (anyOneSchema.allOf !== undefined) {
                                anyOneChildren.push(createNodes(anyOneSchema));
                            }
                            if (anyOneSchema.items !== undefined) {
                                anyOneChildren.push(createItems(anyOneSchema));
                            }
                            if (anyOneSchema.type === "string" ||
                                anyOneSchema.type === "number" ||
                                anyOneSchema.type === "integer" ||
                                anyOneSchema.type === "boolean") {
                                anyOneChildren.push(createNodes(anyOneSchema));
                            }
                            if (anyOneChildren.length) {
                                return (0, utils_1.create)("TabItem", {
                                    label: label,
                                    value: `${index}-item-properties`,
                                    children: anyOneChildren,
                                });
                            }
                            return undefined;
                        }),
                    }),
                ],
            }),
        ],
    });
}
function createProperties(schema) {
    const discriminator = schema.discriminator;
    return Object.entries(schema.properties).map(([key, val]) => createEdges({
        name: key,
        schema: val,
        required: Array.isArray(schema.required)
            ? schema.required.includes(key)
            : false,
        discriminator,
    }));
}
function createAdditionalProperties(schema) {
    // TODO?:
    //   {
    //   description: 'Integration configuration. See \n' +
    //     '[Integration Configurations](https://prisma.pan.dev/api/cloud/api-integration-config/).\n',
    //   example: { webhookUrl: 'https://hooks.slack.com/abcdef' },
    //   externalDocs: { url: 'https://prisma.pan.dev/api/cloud/api-integration-config' },
    //   type: 'object'
    // }
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    // TODO?:
    // {
    // items: {
    //     properties: {
    //       aliasField: [Object],
    //       displayName: [Object],
    //       fieldName: [Object],
    //       maxLength: [Object],
    //       options: [Object],
    //       redlockMapping: [Object],
    //       required: [Object],
    //       type: [Object],
    //       typeaheadUri: [Object],
    //       value: [Object]
    //     },
    //     type: 'object'
    //   },
    //   type: 'array'
    // }
    if (((_a = schema.additionalProperties) === null || _a === void 0 ? void 0 : _a.type) === "string" ||
        ((_b = schema.additionalProperties) === null || _b === void 0 ? void 0 : _b.type) === "object" ||
        ((_c = schema.additionalProperties) === null || _c === void 0 ? void 0 : _c.type) === "boolean" ||
        ((_d = schema.additionalProperties) === null || _d === void 0 ? void 0 : _d.type) === "integer" ||
        ((_e = schema.additionalProperties) === null || _e === void 0 ? void 0 : _e.type) === "number") {
        const type = (_f = schema.additionalProperties) === null || _f === void 0 ? void 0 : _f.type;
        const additionalProperties = (_g = schema.additionalProperties) === null || _g === void 0 ? void 0 : _g.additionalProperties;
        if (additionalProperties !== undefined) {
            const type = (_j = (_h = schema.additionalProperties) === null || _h === void 0 ? void 0 : _h.additionalProperties) === null || _j === void 0 ? void 0 : _j.type;
            const format = (_l = (_k = schema.additionalProperties) === null || _k === void 0 ? void 0 : _k.additionalProperties) === null || _l === void 0 ? void 0 : _l.format;
            return (0, utils_1.create)("li", {
                children: (0, utils_1.create)("div", {
                    children: [
                        (0, utils_1.create)("code", { children: `property name*` }),
                        (0, utils_1.guard)(type, (type) => (0, utils_1.create)("span", {
                            style: { opacity: "0.6" },
                            children: ` ${type}`,
                        })),
                        (0, utils_1.guard)(format, (format) => (0, utils_1.create)("span", {
                            style: { opacity: "0.6" },
                            children: ` (${format})`,
                        })),
                        (0, utils_1.guard)((0, schema_1.getQualifierMessage)(schema.additionalProperties), (message) => (0, utils_1.create)("div", {
                            style: { marginTop: "var(--ifm-table-cell-padding)" },
                            children: (0, createDescription_1.createDescription)(message),
                        })),
                    ],
                }),
            });
        }
        return (0, utils_1.create)("li", {
            children: (0, utils_1.create)("div", {
                children: [
                    (0, utils_1.create)("code", { children: `property name*` }),
                    (0, utils_1.guard)(type, (type) => (0, utils_1.create)("span", {
                        style: { opacity: "0.6" },
                        children: ` ${type}`,
                    })),
                    (0, utils_1.guard)((0, schema_1.getQualifierMessage)(schema.additionalProperties), (message) => (0, utils_1.create)("div", {
                        style: { marginTop: "var(--ifm-table-cell-padding)" },
                        children: (0, createDescription_1.createDescription)(message),
                    })),
                ],
            }),
        });
    }
    return Object.entries(schema.additionalProperties).map(([key, val]) => createEdges({
        name: key,
        schema: val,
        required: Array.isArray(schema.required)
            ? schema.required.includes(key)
            : false,
    }));
}
// TODO: figure out how to handle array of objects
function createItems(schema) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (((_a = schema.items) === null || _a === void 0 ? void 0 : _a.properties) !== undefined) {
        return createProperties(schema.items);
    }
    if (((_b = schema.items) === null || _b === void 0 ? void 0 : _b.additionalProperties) !== undefined) {
        return createAdditionalProperties(schema.items);
    }
    if (((_c = schema.items) === null || _c === void 0 ? void 0 : _c.oneOf) !== undefined || ((_d = schema.items) === null || _d === void 0 ? void 0 : _d.anyOf) !== undefined) {
        return createAnyOneOf(schema.items);
    }
    if (((_e = schema.items) === null || _e === void 0 ? void 0 : _e.allOf) !== undefined) {
        // TODO: figure out if and how we should pass merged required array
        const { mergedSchemas, } = mergeAllOf((_f = schema.items) === null || _f === void 0 ? void 0 : _f.allOf);
        // Handles combo anyOf/oneOf + properties
        if ((mergedSchemas.oneOf !== undefined ||
            mergedSchemas.anyOf !== undefined) &&
            mergedSchemas.properties) {
            return (0, utils_1.create)("div", {
                children: [
                    createAnyOneOf(mergedSchemas),
                    createProperties(mergedSchemas),
                ],
            });
        }
        // Handles only anyOf/oneOf
        if (mergedSchemas.oneOf !== undefined ||
            mergedSchemas.anyOf !== undefined) {
            return (0, utils_1.create)("div", {
                children: [
                    createAnyOneOf(mergedSchemas),
                    createProperties(mergedSchemas),
                ],
            });
        }
    }
    if (((_g = schema.items) === null || _g === void 0 ? void 0 : _g.type) === "string" ||
        ((_h = schema.items) === null || _h === void 0 ? void 0 : _h.type) === "number" ||
        ((_j = schema.items) === null || _j === void 0 ? void 0 : _j.type) === "integer" ||
        ((_k = schema.items) === null || _k === void 0 ? void 0 : _k.type) === "boolean") {
        return createNodes(schema.items);
    }
    // TODO: clean this up or eliminate it?
    return Object.entries(schema.items).map(([key, val]) => createEdges({
        name: key,
        schema: val,
        required: Array.isArray(schema.required)
            ? schema.required.includes(key)
            : false,
    }));
}
/**
 * For handling discriminators that do not map to a same-level property
 */
// function createDiscriminator(schema: SchemaObject) {
//   const discriminator = schema.discriminator;
//   const propertyName = discriminator?.propertyName;
//   const propertyType = "string"; // should always be string
//   const mapping: any = discriminator?.mapping;
//   // Explicit mapping is required since we can't support implicit
//   if (mapping === undefined) {
//     return undefined;
//   }
//   // Attempt to get the property description we want to display
//   // TODO: how to make it predictable when handling allOf
//   let propertyDescription;
//   const firstMappingSchema = mapping[Object.keys(mapping)[0]];
//   if (firstMappingSchema.properties !== undefined) {
//     propertyDescription =
//       firstMappingSchema.properties![propertyName!].description;
//   }
//   if (firstMappingSchema.allOf !== undefined) {
//     const { mergedSchemas }: { mergedSchemas: SchemaObject } = mergeAllOf(
//       firstMappingSchema.allOf
//     );
//     if (mergedSchemas.properties !== undefined) {
//       propertyDescription =
//         mergedSchemas.properties[propertyName!]?.description;
//     }
//   }
//   if (propertyDescription === undefined) {
//     if (
//       schema.properties !== undefined &&
//       schema.properties![propertyName!] !== undefined
//     ) {
//       propertyDescription = schema.properties![propertyName!].description;
//     }
//   }
//   return create("div", {
//     className: "discriminatorItem",
//     children: create("div", {
//       children: [
//         create("strong", {
//           style: { paddingLeft: "1rem" },
//           children: propertyName,
//         }),
//         guard(propertyType, (name) =>
//           create("span", {
//             style: { opacity: "0.6" },
//             children: ` ${propertyType}`,
//           })
//         ),
//         guard(getQualifierMessage(schema.discriminator as any), (message) =>
//           create("div", {
//             style: {
//               paddingLeft: "1rem",
//             },
//             children: createDescription(message),
//           })
//         ),
//         guard(propertyDescription, (description) =>
//           create("div", {
//             style: {
//               paddingLeft: "1rem",
//             },
//             children: createDescription(description),
//           })
//         ),
//         create("DiscriminatorTabs", {
//           children: Object.keys(mapping!).map((key, index) => {
//             if (mapping[key].allOf !== undefined) {
//               const { mergedSchemas }: { mergedSchemas: SchemaObject } =
//                 mergeAllOf(mapping[key].allOf);
//               // Cleanup duplicate property from mapping schema
//               delete mergedSchemas.properties![propertyName!];
//               mapping[key] = mergedSchemas;
//             }
//             if (mapping[key].properties !== undefined) {
//               // Cleanup duplicate property from mapping schema
//               delete mapping[key].properties![propertyName!];
//             }
//             const label = key;
//             return create("TabItem", {
//               label: label,
//               value: `${index}-item-discriminator`,
//               children: [
//                 create("div", {
//                   style: { marginLeft: "-4px" },
//                   children: createNodes(mapping[key]),
//                 }),
//               ],
//             });
//           }),
//         }),
//       ],
//     }),
//   });
// }
function createDetailsNode(name, schemaName, schema, required) {
    return (0, utils_1.create)("SchemaItem", {
        collapsible: true,
        className: "schemaItem",
        children: [
            (0, createDetails_1.createDetails)({
                children: [
                    (0, createDetailsSummary_1.createDetailsSummary)({
                        children: [
                            (0, utils_1.create)("strong", { children: name }),
                            (0, utils_1.create)("span", {
                                style: { opacity: "0.6" },
                                children: ` ${schemaName}`,
                            }),
                            (0, utils_1.guard)(schema.required && schema.required === true, () => [
                                (0, utils_1.create)("strong", {
                                    style: {
                                        fontSize: "var(--ifm-code-font-size)",
                                        color: "var(--openapi-required)",
                                    },
                                    children: " required",
                                }),
                            ]),
                        ],
                    }),
                    (0, utils_1.create)("div", {
                        style: { marginLeft: "1rem" },
                        children: [
                            (0, utils_1.guard)((0, schema_1.getQualifierMessage)(schema), (message) => (0, utils_1.create)("div", {
                                style: { marginTop: ".5rem", marginBottom: ".5rem" },
                                children: (0, createDescription_1.createDescription)(message),
                            })),
                            (0, utils_1.guard)(schema.description, (description) => (0, utils_1.create)("div", {
                                style: { marginTop: ".5rem", marginBottom: ".5rem" },
                                children: (0, createDescription_1.createDescription)(description),
                            })),
                            createNodes(schema),
                        ],
                    }),
                ],
            }),
        ],
    });
}
/**
 * For handling discriminators that map to a same-level property (like 'petType').
 * Note: These should only be encountered while iterating through properties.
 */
function createPropertyDiscriminator(name, schemaName, schema, discriminator, required) {
    if (schema === undefined) {
        return undefined;
    }
    if (discriminator.mapping === undefined) {
        return undefined;
    }
    return (0, utils_1.create)("div", {
        className: "discriminatorItem",
        children: (0, utils_1.create)("div", {
            children: [
                (0, utils_1.create)("strong", { style: { paddingLeft: "1rem" }, children: name }),
                (0, utils_1.guard)(schemaName, (name) => (0, utils_1.create)("span", {
                    style: { opacity: "0.6" },
                    children: ` ${schemaName}`,
                })),
                (0, utils_1.guard)(required, () => [
                    (0, utils_1.create)("strong", {
                        style: {
                            fontSize: "var(--ifm-code-font-size)",
                            color: "var(--openapi-required)",
                        },
                        children: " required",
                    }),
                ]),
                (0, utils_1.guard)((0, schema_1.getQualifierMessage)(discriminator), (message) => (0, utils_1.create)("div", {
                    style: {
                        paddingLeft: "1rem",
                    },
                    children: (0, createDescription_1.createDescription)(message),
                })),
                (0, utils_1.guard)(schema.description, (description) => (0, utils_1.create)("div", {
                    style: {
                        paddingLeft: "1rem",
                    },
                    children: (0, createDescription_1.createDescription)(description),
                })),
                (0, utils_1.create)("DiscriminatorTabs", {
                    children: Object.keys(discriminator === null || discriminator === void 0 ? void 0 : discriminator.mapping).map((key, index) => {
                        const label = key;
                        return (0, utils_1.create)("TabItem", {
                            label: label,
                            value: `${index}-item-discriminator`,
                            children: [
                                (0, utils_1.create)("div", {
                                    style: { marginLeft: "-4px" },
                                    children: createNodes(discriminator === null || discriminator === void 0 ? void 0 : discriminator.mapping[key]),
                                }),
                            ],
                        });
                    }),
                }),
            ],
        }),
    });
}
/**
 * Creates the edges or "leaves" of a schema tree. Edges can branch into sub-nodes with createDetails().
 */
function createEdges({ name, schema, required, discriminator, }) {
    var _a, _b;
    const schemaName = (0, schema_1.getSchemaName)(schema);
    if (discriminator !== undefined && discriminator.propertyName === name) {
        return createPropertyDiscriminator(name, "string", schema, discriminator, required);
    }
    if (schema.oneOf !== undefined || schema.anyOf !== undefined) {
        return createDetailsNode(name, schemaName, schema, required);
    }
    if (schema.allOf !== undefined) {
        const { mergedSchemas, required, } = mergeAllOf(schema.allOf);
        const mergedSchemaName = (0, schema_1.getSchemaName)(mergedSchemas);
        if (mergedSchemas.oneOf !== undefined ||
            mergedSchemas.anyOf !== undefined) {
            return createDetailsNode(name, mergedSchemaName, mergedSchemas, required);
        }
        if (mergedSchemas.properties !== undefined) {
            return createDetailsNode(name, mergedSchemaName, mergedSchemas, required);
        }
        if (mergedSchemas.additionalProperties !== undefined) {
            return createDetailsNode(name, mergedSchemaName, mergedSchemas, required);
        }
        // array of objects
        if (((_a = mergedSchemas.items) === null || _a === void 0 ? void 0 : _a.properties) !== undefined) {
            return createDetailsNode(name, mergedSchemaName, mergedSchemas, required);
        }
        if (mergedSchemas.readOnly && mergedSchemas.readOnly === true) {
            return undefined;
        }
        return (0, utils_1.create)("SchemaItem", {
            collapsible: false,
            name,
            required: Array.isArray(required) ? required.includes(name) : required,
            schemaDescription: mergedSchemas.description,
            schemaName: schemaName,
            qualifierMessage: (0, schema_1.getQualifierMessage)(schema),
            defaultValue: mergedSchemas.default,
        });
    }
    if (schema.properties !== undefined) {
        return createDetailsNode(name, schemaName, schema, required);
    }
    if (schema.additionalProperties !== undefined) {
        return createDetailsNode(name, schemaName, schema, required);
    }
    // array of objects
    if (((_b = schema.items) === null || _b === void 0 ? void 0 : _b.properties) !== undefined) {
        return createDetailsNode(name, schemaName, schema, required);
    }
    if (schema.readOnly && schema.readOnly === true) {
        return undefined;
    }
    // primitives and array of non-objects
    return (0, utils_1.create)("SchemaItem", {
        collapsible: false,
        name,
        required: Array.isArray(required) ? required.includes(name) : required,
        schemaDescription: schema.description,
        schemaName: schemaName,
        qualifierMessage: (0, schema_1.getQualifierMessage)(schema),
        defaultValue: schema.default,
    });
}
/**
 * Creates a hierarchical level of a schema tree. Nodes produce edges that can branch into sub-nodes with edges, recursively.
 */
function createNodes(schema) {
    // if (schema.discriminator !== undefined) {
    //   return createDiscriminator(schema);
    // }
    if (schema.oneOf !== undefined || schema.anyOf !== undefined) {
        return createAnyOneOf(schema);
    }
    if (schema.allOf !== undefined) {
        const { mergedSchemas } = mergeAllOf(schema.allOf);
        // allOf seems to always result in properties
        if (mergedSchemas.properties !== undefined) {
            return createProperties(mergedSchemas);
        }
    }
    if (schema.properties !== undefined) {
        return createProperties(schema);
    }
    if (schema.additionalProperties !== undefined) {
        return createAdditionalProperties(schema);
    }
    // TODO: figure out how to handle array of objects
    if (schema.items !== undefined) {
        return createItems(schema);
    }
    // primitive
    if (schema.type !== undefined) {
        return (0, utils_1.create)("li", {
            children: (0, utils_1.create)("div", {
                children: [
                    (0, utils_1.create)("strong", { children: schema.type }),
                    (0, utils_1.guard)(schema.format, (format) => (0, utils_1.create)("span", {
                        style: { opacity: "0.6" },
                        children: ` ${format}`,
                    })),
                    (0, utils_1.guard)((0, schema_1.getQualifierMessage)(schema), (message) => (0, utils_1.create)("div", {
                        style: { marginTop: "var(--ifm-table-cell-padding)" },
                        children: (0, createDescription_1.createDescription)(message),
                    })),
                    (0, utils_1.guard)(schema.description, (description) => (0, utils_1.create)("div", {
                        style: { marginTop: "var(--ifm-table-cell-padding)" },
                        children: (0, createDescription_1.createDescription)(description),
                    })),
                ],
            }),
        });
    }
    // Unknown node/schema type should return undefined
    // So far, haven't seen this hit in testing
    return undefined;
}
function createRequestSchema({ title, body, ...rest }) {
    if (body === undefined ||
        body.content === undefined ||
        Object.keys(body).length === 0 ||
        Object.keys(body.content).length === 0) {
        return undefined;
    }
    // Get all MIME types, including vendor-specific
    const mimeTypes = Object.keys(body.content);
    if (mimeTypes && mimeTypes.length > 1) {
        return (0, utils_1.create)("MimeTabs", {
            groupId: "mime-type",
            children: mimeTypes.map((mimeType) => {
                const firstBody = body.content[mimeType].schema;
                if (firstBody === undefined) {
                    return undefined;
                }
                if (firstBody.properties !== undefined) {
                    if (Object.keys(firstBody.properties).length === 0) {
                        return undefined;
                    }
                }
                return (0, utils_1.create)("TabItem", {
                    label: mimeType,
                    value: `${mimeType}`,
                    children: [
                        (0, createDetails_1.createDetails)({
                            "data-collapsed": false,
                            open: true,
                            ...rest,
                            children: [
                                (0, createDetailsSummary_1.createDetailsSummary)({
                                    style: { textAlign: "left" },
                                    children: [
                                        (0, utils_1.create)("strong", { children: `${title}` }),
                                        (0, utils_1.guard)(firstBody.type === "array", (format) => (0, utils_1.create)("span", {
                                            style: { opacity: "0.6" },
                                            children: ` array`,
                                        })),
                                        (0, utils_1.guard)(body.required && body.required === true, () => [
                                            (0, utils_1.create)("strong", {
                                                style: {
                                                    fontSize: "var(--ifm-code-font-size)",
                                                    color: "var(--openapi-required)",
                                                },
                                                children: " required",
                                            }),
                                        ]),
                                    ],
                                }),
                                (0, utils_1.create)("div", {
                                    style: { textAlign: "left", marginLeft: "1rem" },
                                    children: [
                                        (0, utils_1.guard)(body.description, () => [
                                            (0, utils_1.create)("div", {
                                                style: { marginTop: "1rem", marginBottom: "1rem" },
                                                children: (0, createDescription_1.createDescription)(body.description),
                                            }),
                                        ]),
                                    ],
                                }),
                                (0, utils_1.create)("ul", {
                                    style: { marginLeft: "1rem" },
                                    children: createNodes(firstBody),
                                }),
                            ],
                        }),
                    ],
                });
            }),
        });
    }
    const randomFirstKey = Object.keys(body.content)[0];
    const firstBody = body.content[randomFirstKey].schema;
    if (firstBody === undefined) {
        return undefined;
    }
    // we don't show the table if there is no properties to show
    if (firstBody.properties !== undefined) {
        if (Object.keys(firstBody.properties).length === 0) {
            return undefined;
        }
    }
    return (0, utils_1.create)("MimeTabs", {
        children: [
            (0, utils_1.create)("TabItem", {
                label: randomFirstKey,
                value: `${randomFirstKey}-schema`,
                children: [
                    (0, createDetails_1.createDetails)({
                        "data-collapsed": false,
                        open: true,
                        ...rest,
                        children: [
                            (0, createDetailsSummary_1.createDetailsSummary)({
                                style: { textAlign: "left" },
                                children: [
                                    (0, utils_1.create)("strong", { children: `${title}` }),
                                    (0, utils_1.guard)(firstBody.type === "array", (format) => (0, utils_1.create)("span", {
                                        style: { opacity: "0.6" },
                                        children: ` array`,
                                    })),
                                    (0, utils_1.guard)(body.required, () => [
                                        (0, utils_1.create)("strong", {
                                            style: {
                                                fontSize: "var(--ifm-code-font-size)",
                                                color: "var(--openapi-required)",
                                            },
                                            children: " required",
                                        }),
                                    ]),
                                ],
                            }),
                            (0, utils_1.create)("div", {
                                style: { textAlign: "left", marginLeft: "1rem" },
                                children: [
                                    (0, utils_1.guard)(body.description, () => [
                                        (0, utils_1.create)("div", {
                                            style: { marginTop: "1rem", marginBottom: "1rem" },
                                            children: (0, createDescription_1.createDescription)(body.description),
                                        }),
                                    ]),
                                ],
                            }),
                            (0, utils_1.create)("ul", {
                                style: { marginLeft: "1rem" },
                                children: createNodes(firstBody),
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
}
exports.createRequestSchema = createRequestSchema;
