import { AppInfo, CloudFoundryInfo, Deployment, ProgressLog } from "./DeploymentChain";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { ActionResult, successOn } from "@atomist/automation-client/action/ActionResult";
import { logger } from "@atomist/automation-client/internal/util/logger";
import { identification } from "../../../../test/commands/editor/spring/pomParser";
import { spawn } from "child_process";

export function build<P extends LocalProject>(p: P, log: ProgressLog): Promise<ActionResult<P>> {
    log.write("Running Maven build...\n");
    return runCommand("mvn package", {
        cwd: p.baseDir,
        maxBuffer: 1024 * 1000,
    })
        .then(r => {
            logger.info("Maven build completed OK");
            log.write("Maven build completed OK...\n");
            return r;
        })
        .then(r => successOn(p));
}

function toJar(ai: AppInfo) {
    return `target/${ai.name}-${ai.version}.jar`;
}

export function deploy<P extends LocalProject>(p: P, cfi: CloudFoundryInfo, log: ProgressLog): Promise<Deployment> {
    log.write("Analyzing application...\n");
    const appId: Promise<AppInfo> =
        p.findFile("pom.xml")
            .then(pom => pom.getContent()
                .then(content => identification(content)))
            .then(va => ({...va, name: va.artifact}));

    return appId.then(ai => {
        logger.info("Deploying app [%j] to Cloud Foundry [%j]", ai, cfi);
        log.write(`Logging into Cloud Foundry as ${cfi.username}...\n`);

        return runCommand(`cf login -a ${cfi.api} -o ${cfi.org} -u ${cfi.username} -p "${cfi.password}" -s ${cfi.space}`,
            {cwd: p.baseDir})// [-o ORG] [-s SPACE]`)
            .then(_ => {
                console.log("Successfully logged into Cloud Foundry as [%s]", cfi.username);
                return _;
            })
            .then(() => {
                const childProcess = spawn("cf",
                    [
                        "push",
                        ai.name,
                        "-p",
                        toJar(ai),
                        "--random-route",
                    ],
                    {
                        cwd: p.baseDir,
                    });
                // .catch(err => {
                //     logger.warn("Failed to deploy to cloud foundry: %j", err);
                //     return Promise.reject(err);
                // })
                childProcess.on("error", err => console.log(err));
                return {
                    childProcess,
                    url: toUrl(ai.name),
                };
            });
    });
}

function toUrl(name: string) {
    return `http://${name}.cfapps.io/`;
}