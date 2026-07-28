export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepository {
  name: string;
  full_name: string;
  html_url: string;
  owner: GitHubUser;
  stargazers_count?: number;
}

export interface GitHubCommit {
  id: string;
  message: string;
  url: string;
  author: {
    name: string;
    username?: string;
  };
  added?: string[];
  removed?: string[];
  modified?: string[];
}

export interface GitHubPushPayload {
  ref: string;
  commits: GitHubCommit[];
  head_commit?: GitHubCommit;
  repository: GitHubRepository;
  sender: GitHubUser;
  compare: string;
}

export interface GitHubPullRequestPayload {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | 'assigned' | 'review_requested';
  number: number;
  pull_request: {
    title: string;
    body: string | null;
    html_url: string;
    merged: boolean;
    merged_by?: GitHubUser;
    user: GitHubUser;
    head: { ref: string };
    base: { ref: string };
    requested_reviewers?: GitHubUser[];
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface GitHubIssuePayload {
  action: 'opened' | 'closed' | 'reopened' | 'edited';
  issue: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    user: GitHubUser;
    labels?: Array<{ name: string }>;
    assignees?: GitHubUser[];
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface GitHubReleasePayload {
  action: 'published' | 'created';
  release: {
    tag_name: string;
    name: string;
    body: string;
    html_url: string;
    author: GitHubUser;
    assets?: Array<{ name: string; download_count: number }>;
  };
  repository: GitHubRepository;
  sender: GitHubUser;
}

export interface GitHubWorkflowRunPayload {
  action: 'completed' | 'requested' | 'in_progress';
  workflow_run: {
    name: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    html_url: string;
    actor: GitHubUser;
    run_started_at?: string;
    updated_at?: string;
  };
  repository: GitHubRepository;
}
