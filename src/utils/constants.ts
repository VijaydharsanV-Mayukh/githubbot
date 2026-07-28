export const GITHUB_EVENTS = [
  'push',
  'pull_request',
  'pull_request_review',
  'pull_request_review_comment',
  'issues',
  'issue_comment',
  'release',
  'create',
  'delete',
  'fork',
  'watch',
  'workflow_run',
  'workflow_job',
  'deployment',
  'deployment_status',
  'discussion',
  'discussion_comment'
] as const;

export type SupportedGitHubEvent = (typeof GITHUB_EVENTS)[number];
