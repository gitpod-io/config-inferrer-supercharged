//import { createPrompt } from 'bun-promptx';
import { Octokit } from 'octokit';
import { Configuration, OpenAIApi } from "openai";

const imageNames = [
    "workspace-full",
    "workspace-mongodb",
    "workspace-base",
    "workspace-dotnet",
    "workspace-full-vnc",
    "workspace-mysql",
    "workspace-postgres",
    "workspace-c",
    "workspace-clojure",
    "workspace-go",
    "workspace-java-11",
    "workspace-java-17",
    "workspace-node",
    "workspace-node-lts",
    "workspace-python",
    "workspace-rust",
    "workspace-elixir",
];

//const repoUrl = createPrompt("Enter GitHub repo: ");
const repoUrl = { value: "https://github.com/prometheus-operator/prometheus-operator" };
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const fetchFile = async (owner: string, repo: string, path: string) => {
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
        });
        return Buffer.from(data.content, 'base64').toString();
    } catch (_) {
        return null;
    }
};

(async () => {
    const [owner, repo] = repoUrl.value.split('/').slice(-2)

    const { data: languages } = await octokit.rest.repos.listLanguages({
        owner,
        repo,
    });

    console.info("Crafting message...");

    const gitIgnorePath = `.gitignore`;
    const gitIgnore = await fetchFile(owner, repo, gitIgnorePath);

    console.info("Got gitignore...");

    const prompt: string[] = [];
    prompt.push(`Write the gitpod.yml with a corresponding .gitpod.Dockerfile for the following repo: ${repoUrl.value}`);

    if (languages.length > 0) {
        prompt.push(`Languages: ${Object.keys(languages).join(', ')}`);
    }

    if (gitIgnore) {
        prompt.push(`
        Gitignore file: 
            \`\`\`${gitIgnore}\`\`\`
    `);
    }
    prompt.push(`There are some pre-built images available for you to use: ${imageNames.join(', ')}`);

    const packageJsonPath = `package.json`;
    const packageJson = await fetchFile(owner, repo, packageJsonPath);

    if (packageJson) {
        prompt.push(`
            package.json file:
                \`\`\`${packageJson}\`\`\`
        `);
    }

    console.info("Sending request to OpenAI...");
    console.info(prompt.join('\n'));

    const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: "You are GitpodYmlGpt. You generate gitpod.yml files for GitHub repos. You only respond with the two code blocks, no other text."
            },
            {
                role: "user",
                content: prompt.join('\n')
            },
        ],
    });
    console.log(JSON.stringify(completion.data.choices, null, 2));
})();