"use strict";
/* ============================================================================
 * Copyright (c) Palo Alto Networks
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * ========================================================================== */
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = exports.guard = exports.create = void 0;
function create(tag, props) {
    const { children, ...rest } = props;
    let propString = "";
    for (const [key, value] of Object.entries(rest)) {
        propString += ` ${key}={${JSON.stringify(value)}}`;
    }
    return `<${tag}${propString}>${render(children)}</${tag}>`;
}
exports.create = create;
function guard(value, cb) {
    if (value) {
        const children = cb(value);
        return render(children);
    }
    return "";
}
exports.guard = guard;
function render(children) {
    if (Array.isArray(children)) {
        const filteredChildren = children.filter((c) => c !== undefined);
        return filteredChildren
            .map((i) => (Array.isArray(i) ? i.join("") : i))
            .join("");
    }
    return children !== null && children !== void 0 ? children : "";
}
exports.render = render;
