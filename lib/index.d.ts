import type { LoadContext, Plugin } from "@docusaurus/types";
import type { PluginOptions, LoadedContent } from "./types";
export declare function isURL(str: string): boolean;
export declare function getDocsData(dataArray: any[], filter: string): Object | undefined;
declare function pluginOpenAPIDocs(context: LoadContext, options: PluginOptions): Plugin<LoadedContent>;
declare namespace pluginOpenAPIDocs {
    var validateOptions: ({ options, validate }: any) => any;
}
export default pluginOpenAPIDocs;
