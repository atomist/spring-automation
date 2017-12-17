import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom, OnCommand } from "@atomist/automation-client/onCommand";
import { MappedOrFallbackParameters } from "./MappedOrFallbackParameters";
import { nodeTaggerCommand } from "./nodeTagger";
import { springBootTaggerCommand } from "./springTagger";

const handler: OnCommand<MappedOrFallbackParameters> =
    (ctx, parameters) => {
        // Fortunately all these commands have the same parameters
        // TODO why do we need to break this up for compile checking?
        const springTag: Promise<any> = springBootTaggerCommand().handle(ctx, parameters);
        const nodeTag: Promise<any> = nodeTaggerCommand().handle(ctx, parameters);
        return springTag
            .then(() => nodeTag)
            .then(() => ctx.messageClient.respond("Tagging complete"));
    };

export const tagAllCommand: HandleCommand = commandHandlerFrom(
    handler,
    MappedOrFallbackParameters,
    "TagAll",
    "Tag all repos",
    "tag all",
    // No tags as we only want to run from the bot
    [],
);
