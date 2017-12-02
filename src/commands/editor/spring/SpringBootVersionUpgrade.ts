import { HandleCommand, Parameter } from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { allReposInTeam } from "@atomist/automation-client/operations/common/allReposInTeamRepoFinder";
import { gitHubRepoLoader } from "@atomist/automation-client/operations/common/gitHubRepoLoader";
import { RepoFinder } from "@atomist/automation-client/operations/common/repoFinder";
import { RepoLoader } from "@atomist/automation-client/operations/common/repoLoader";
import { EditMode, PullRequest } from "@atomist/automation-client/operations/edit/editModes";
import { editorHandler } from "@atomist/automation-client/operations/edit/editorToCommand";
import { setSpringBootVersionEditor } from "./setSpringBootVersionEditor";
import { CurrentSpringBootVersion } from "../../reviewer/spring/SpringBootVersionReviewer";
import { MappedRepoParameters } from "@atomist/automation-client/operations/common/params/MappedRepoParameters";

@Parameters()
export class SpringBootVersionUpgradeParameters extends MappedRepoParameters {

    @Parameter({
        displayName: "Desired Spring Boot version",
        description: "The desired Spring Boot version across these repos",
        pattern: /^.+$/,
        validInput: "Semantic version",
        required: false,
    })
    public desiredBootVersion: string = CurrentSpringBootVersion;

}

/**
 * Upgrade the version of Spring Boot projects to a desired version
 */
export function springBootVersionUpgrade(repoFinder: RepoFinder = allReposInTeam(),
                                         repoLoader: (p: SpringBootVersionUpgradeParameters) => RepoLoader =
                                             p => gitHubRepoLoader({token: p.githubToken}),
                                         testEditMode?: EditMode): HandleCommand<SpringBootVersionUpgradeParameters> {

    console.log("RepoFinder = " + repoFinder + ", RepoLoader = " + repoLoader + ", editMode=" + testEditMode);
    return editorHandler<SpringBootVersionUpgradeParameters>(
        params => setSpringBootVersionEditor(params.desiredBootVersion),
        SpringBootVersionUpgradeParameters,
        "SpringBootVersionUpgrade", {
            repoFinder,
            repoLoader,
            description: "Upgrade versions of Spring Boot across an org",
            intent: "upgrade spring boot version",
            editMode: testEditMode || (params => new PullRequest(
                "spring-boot-" + params.desiredBootVersion,
                "Upgrade Spring Boot to " + params.desiredBootVersion)),
        });
}
