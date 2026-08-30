import type { Plugin } from '@opencode-ai/plugin';
/** Build the DashScope multimodal-generation request body. */
export declare function buildRequestBody(model: string, prompt: string, size: string): {
    model: string;
    input: {
        messages: {
            role: string;
            content: {
                text: string;
            }[];
        }[];
    };
    parameters: {
        size: string;
    };
};
/** Extract the generated image URL from a DashScope response payload. */
export declare function extractImageUrl(json: {
    code?: string;
    message?: string;
    status?: number;
    output?: {
        choices?: {
            message?: {
                content?: {
                    image?: string;
                }[];
            };
        }[];
    };
}): string;
/** Decide where the PNG lands: explicit absolute path or auto-named file in dir. */
export declare function computeOutputPath(outputPath: string | undefined, dir: string, isoTs: string): string;
export declare const DashscopeImagegenPlugin: Plugin;
