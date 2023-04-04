import { createPrompt } from 'bun-promptx';
import { Octokit } from '@octokit/rest';

const repoUrl = createPrompt("Enter GitHub repo: ");

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

(async () => {
    const [owner, repo] = repoUrl.value.split('/').slice(-2)

    const {data: languages} = await octokit.repos.listLanguages({
        owner,
        repo,
    });

    const gitIgnorePath = `.gitignore`;
    const gitIgnore = await octokit.repos.getContent({
        owner,
        repo,
        path: gitIgnorePath,
    });

    const gitIgnoreContent = Buffer.from(gitIgnore.data.content, 'base64').toString();

})();