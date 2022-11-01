import { Octokit } from "@octokit/core";
import libsodium from 'libsodium-wrappers';


export function buildYaml(account: string = '', project: string = '') {
  const privateKey = '${{ secrets.PRIVATE_KEY }}';
  const release = '${{ env.TIMESTAMP }}';
  return `name: Valist Publish
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: valist-io/valist-github-action@v2.3.1
        with:
          private-key: ${privateKey}
          account: ${account}
          project: ${project}
          release: ${release}
          path: 'out'
`
};

const owner = 'jiyuu-jin';
const repo = 'web3-game';

const author = {
  name: 'jiyuu-jin',
  email: 'zach@valist.io',
};

const url = '/repos/{owner}/{repo}/{path}';
const ref = 'heads/main';

export async function createPullRequest(octokit: Octokit, valistConfig: string) {
  // Upload file blob
  const fileBlob = await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
    owner,
    repo,
    content: valistConfig,
    encoding: 'utf-8',
  });
  const fileBlobSHA = fileBlob.data.sha;
  console.log('fileBlobSHA', fileBlobSHA);

  // Get main tree sha to create branch
  const tree = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
    owner,
    repo,
    branch: 'main',
  });
  const mainTreeSHA = tree?.data?.commit?.commit?.tree?.sha;
  console.log('main tree sha', mainTreeSHA);

  // Create new tree for branch
  const newTree = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
    owner,
    repo,
    base_tree: mainTreeSHA,
    tree: [
      {
        path: '.github/workflows/valist.yml',
        mode: '100644',
        type: 'blob',
        sha: fileBlobSHA,
      }
    ]
  });
  const newTreeSHA = newTree.data.sha;
  console.log('new tree sha', newTreeSHA);

  // Create a new commit
  const commit = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
    owner,
    repo,
    message: 'Add Valist publish workflow',
    author,
    tree: newTreeSHA,
  });
  const commitSHA = commit.data.sha;
  console.log('commit sha', commitSHA);

  // Create a branch
  const branch = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
    owner,
    repo,
    ref: 'refs/heads/feature/valist',
    sha: commitSHA,
  });
  console.log('branch', branch);

  // Create a pull request
  const pullRequest = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
    owner,
    repo,
    title: 'Add Valist GitHub Action',
    body: 'Adds valist publish to CI/CD pipeline!',
    head: 'feature/valist',
    base: 'main'
  });
  console.log('pull request', pullRequest);
};

export async function addSecret(octokit: Octokit) {
  const key = await getRepoPubicKey(octokit);

  const value = "secret";

  // Convert the message and key to Uint8Array's (Buffer implements that interface)
  const messageBytes = Buffer.from(value);
  const keyBytes = Buffer.from(key?.data?.key, 'base64');

  // Encrypt using LibSodium.
  await libsodium.ready;
  const encryptedBytes = libsodium.crypto_box_seal(messageBytes, keyBytes);

  // Base64 the encrypted secret
  const encrypted = Buffer.from(encryptedBytes).toString('base64');

  console.log(encrypted);

  await octokit.request('PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
    owner: owner,
    repo: repo,
    secret_name: 'VALIST_SIGNER',
    encrypted_value: encrypted,
    key_id: key?.data?.key_id,
  });
};

export async function getRepoPubicKey(octokit: Octokit) {
  const key = await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/public-key', {
    owner: owner,
    repo: repo
  });

  return key;
}

export async function getRepos(octokit: Octokit) {
  return await octokit.request('GET /user/repos', {});
}