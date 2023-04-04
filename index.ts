//import { createPrompt } from 'bun-promptx';
import { Octokit } from '@octokit/rest';
import { Configuration, OpenAIApi } from "openai";

//const repoUrl = createPrompt("Enter GitHub repo: ");
const repoUrl = {value: "https://github.com/gitpod-samples/template-php-laravel-mysql"};
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

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
    const prompt = `Write me a gitpod.yml with a corresponding .gitpod.Dockerfile for the following languages: ${Object.keys(languages).join(', ')}, and the following gitignore: \`\`\`gitignore${gitIgnoreContent}\`\`\``;

    const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: "You are Nicolas Cage. You reply like he would. You always start your message with 'Hi, I'm Nicolas Cage'."
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    });
    console.log(JSON.stringify(completion.data.choices, null, 2));
})();