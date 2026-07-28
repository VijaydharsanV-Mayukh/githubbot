import { EmbedBuilder } from 'discord.js';
import { Colors } from '../utils/colors';
import { truncate, formatDuration } from '../utils/helpers';

export class EmbedService {
  /**
   * Push Event Embed
   */
  public static createPushEmbed(payload: any): EmbedBuilder {
    const repoName = payload.repository?.full_name || 'Repository';
    const branch = (payload.ref || '').replace('refs/heads/', '');
    const commits = payload.commits || [];
    const headCommit = payload.head_commit;
    const author = payload.sender?.login || headCommit?.author?.username || 'Unknown';
    const authorAvatar = payload.sender?.avatar_url;
    const compareUrl = payload.compare || payload.repository?.html_url;

    const commitListText = commits
      .slice(0, 5)
      .map((c: any) => `[` + '`' + c.id.substring(0, 7) + '`' + `](${c.url}) ${truncate(c.message.split('\n')[0], 50)}`)
      .join('\n');

    let totalAdded = 0;
    let totalRemoved = 0;
    let totalModified = 0;
    commits.forEach((c: any) => {
      totalAdded += (c.added || []).length;
      totalRemoved += (c.removed || []).length;
      totalModified += (c.modified || []).length;
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.Push)
      .setTitle(`🚀 Push to ${branch}`)
      .setURL(compareUrl)
      .setAuthor({ name: author, iconURL: authorAvatar, url: payload.sender?.html_url })
      .addFields(
        { name: 'Repository', value: `[${repoName}](${payload.repository?.html_url})`, inline: true },
        { name: 'Branch', value: '`' + branch + '`', inline: true },
        { name: 'Commits', value: `${commits.length} commit(s)`, inline: true }
      )
      .setTimestamp();

    if (commitListText) {
      embed.addFields({ name: 'Commit Messages', value: commitListText });
    }

    if (totalAdded > 0 || totalRemoved > 0 || totalModified > 0) {
      embed.addFields({
        name: 'Files Changed',
        value: `➕ ${totalAdded} added | ➖ ${totalRemoved} removed | ✏️ ${totalModified} modified`,
      });
    }

    return embed;
  }

  /**
   * Pull Request Event Embed
   */
  public static createPullRequestEmbed(payload: any): EmbedBuilder {
    const action = payload.action;
    const pr = payload.pull_request;
    const repoName = payload.repository?.full_name || 'Repository';
    const author = pr.user?.login || 'Unknown';
    const authorAvatar = pr.user?.avatar_url;
    const isMerged = action === 'closed' && pr.merged;

    let color = Colors.PullRequestOpen;
    let titleEmoji = '📌';
    let actionText = action.toUpperCase();

    if (isMerged) {
      color = Colors.PullRequestMerged;
      titleEmoji = '✅';
      actionText = 'MERGED';
    } else if (action === 'closed') {
      color = Colors.PullRequestClosed;
      titleEmoji = '❌';
      actionText = 'CLOSED';
    }

    const reviewers = (pr.requested_reviewers || []).map((r: any) => r.login).join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${titleEmoji} Pull Request #${pr.number}: ${actionText}`)
      .setURL(pr.html_url)
      .setAuthor({ name: author, iconURL: authorAvatar, url: pr.user?.html_url })
      .addFields(
        { name: 'Title', value: truncate(pr.title, 100) },
        { name: 'Repository', value: `[${repoName}](${payload.repository?.html_url})`, inline: true },
        { name: 'Base / Head', value: '`' + pr.base?.ref + '` ← `' + pr.head?.ref + '`', inline: true },
        { name: 'Reviewers', value: reviewers, inline: true }
      )
      .setTimestamp();

    if (isMerged && pr.merged_by) {
      embed.addFields({ name: 'Merged By', value: pr.merged_by.login, inline: true });
    }

    if (pr.body) {
      embed.setDescription(truncate(pr.body, 250));
    }

    return embed;
  }

  /**
   * Pull Request Review Embed
   */
  public static createPullRequestReviewEmbed(payload: any): EmbedBuilder {
    const review = payload.review;
    const pr = payload.pull_request;
    const repoName = payload.repository?.full_name || 'Repository';
    const reviewer = review.user?.login || 'Unknown';
    const reviewerAvatar = review.user?.avatar_url;
    const state = (review.state || 'submitted').toLowerCase();

    let color = Colors.ReviewCommented;
    let stateEmoji = '💬';
    if (state === 'approved') {
      color = Colors.ReviewApproved;
      stateEmoji = '✅';
    } else if (state === 'changes_requested') {
      color = Colors.ReviewChangesRequested;
      stateEmoji = '⚠️';
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${stateEmoji} PR Review: ${state.replace('_', ' ').toUpperCase()} on #${pr.number}`)
      .setURL(review.html_url || pr.html_url)
      .setAuthor({ name: reviewer, iconURL: reviewerAvatar, url: review.user?.html_url })
      .addFields(
        { name: 'PR Title', value: `[#${pr.number} ${pr.title}](${pr.html_url})` },
        { name: 'Repository', value: repoName, inline: true }
      )
      .setTimestamp();

    if (review.body) {
      embed.setDescription(truncate(review.body, 300));
    }

    return embed;
  }

  /**
   * Issues Event Embed
   */
  public static createIssueEmbed(payload: any): EmbedBuilder {
    const action = payload.action;
    const issue = payload.issue;
    const repoName = payload.repository?.full_name || 'Repository';
    const author = issue.user?.login || 'Unknown';
    const authorAvatar = issue.user?.avatar_url;

    let color = Colors.IssueOpen;
    if (action === 'closed') color = Colors.IssueClosed;
    if (action === 'reopened') color = Colors.IssueReopened;

    const labels = (issue.labels || []).map((l: any) => '`' + l.name + '`').join(' ') || 'None';
    const assignees = (issue.assignees || []).map((a: any) => a.login).join(', ') || 'Unassigned';

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🐛 Issue #${issue.number}: ${action.toUpperCase()}`)
      .setURL(issue.html_url)
      .setAuthor({ name: author, iconURL: authorAvatar, url: issue.user?.html_url })
      .addFields(
        { name: 'Title', value: truncate(issue.title, 100) },
        { name: 'Repository', value: `[${repoName}](${payload.repository?.html_url})`, inline: true },
        { name: 'Assignees', value: assignees, inline: true },
        { name: 'Labels', value: labels, inline: true }
      )
      .setTimestamp();

    if (issue.body) {
      embed.setDescription(truncate(issue.body, 250));
    }

    return embed;
  }

  /**
   * Issue Comment Embed
   */
  public static createIssueCommentEmbed(payload: any): EmbedBuilder {
    const comment = payload.comment;
    const issue = payload.issue;
    const repoName = payload.repository?.full_name || 'Repository';
    const author = comment.user?.login || 'Unknown';

    return new EmbedBuilder()
      .setColor(Colors.ReviewCommented)
      .setTitle(`💬 Comment on #${issue.number}: ${truncate(issue.title, 60)}`)
      .setURL(comment.html_url)
      .setAuthor({ name: author, iconURL: comment.user?.avatar_url, url: comment.user?.html_url })
      .setDescription(truncate(comment.body, 300))
      .addFields({ name: 'Repository', value: repoName, inline: true })
      .setTimestamp();
  }

  /**
   * Release Event Embed
   */
  public static createReleaseEmbed(payload: any): EmbedBuilder {
    const release = payload.release;
    const repoName = payload.repository?.full_name || 'Repository';
    const author = release.author?.login || 'Unknown';

    const assets = (release.assets || [])
      .map((a: any) => `📦 [${a.name}](${a.browser_download_url}) (${a.download_count} downloads)`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(Colors.Release)
      .setTitle(`🏷 Release: ${release.name || release.tag_name}`)
      .setURL(release.html_url)
      .setAuthor({ name: author, iconURL: release.author?.avatar_url, url: release.author?.html_url })
      .addFields(
        { name: 'Tag', value: '`' + release.tag_name + '`', inline: true },
        { name: 'Repository', value: `[${repoName}](${payload.repository?.html_url})`, inline: true }
      )
      .setTimestamp();

    if (release.body) {
      embed.setDescription(truncate(release.body, 400));
    }

    if (assets) {
      embed.addFields({ name: 'Assets', value: truncate(assets, 300) });
    }

    return embed;
  }

  /**
   * Workflow Run Embed
   */
  public static createWorkflowRunEmbed(payload: any): EmbedBuilder {
    const run = payload.workflow_run;
    const repoName = payload.repository?.full_name || 'Repository';
    const conclusion = run.conclusion || run.status;
    const isSuccess = conclusion === 'success';

    let color = Colors.WorkflowPending;
    let emoji = '⚙️';
    if (conclusion === 'success') {
      color = Colors.WorkflowSuccess;
      emoji = '✅';
    } else if (conclusion === 'failure') {
      color = Colors.WorkflowFailure;
      emoji = '❌';
    }

    const durationSeconds = run.updated_at && run.run_started_at
      ? Math.floor((new Date(run.updated_at).getTime() - new Date(run.run_started_at).getTime()) / 1000)
      : 0;

    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} GitHub Action: ${run.name}`)
      .setURL(run.html_url)
      .setAuthor({ name: run.actor?.login || 'GitHub Action', iconURL: run.actor?.avatar_url })
      .addFields(
        { name: 'Repository', value: repoName, inline: true },
        { name: 'Branch', value: '`' + run.head_branch + '`', inline: true },
        { name: 'Status', value: conclusion.toUpperCase(), inline: true },
        { name: 'Duration', value: formatDuration(durationSeconds), inline: true }
      )
      .setTimestamp();
  }

  /**
   * Generic Create/Delete/Fork/Watch/Discussion Embeds
   */
  public static createGenericEmbed(eventType: string, payload: any): EmbedBuilder {
    const repoName = payload.repository?.full_name || 'Repository';
    const repoUrl = payload.repository?.html_url;
    const sender = payload.sender?.login || 'User';
    const avatar = payload.sender?.avatar_url;

    if (eventType === 'create') {
      const refType = payload.ref_type;
      const refName = payload.ref;
      return new EmbedBuilder()
        .setColor(Colors.BranchCreate)
        .setTitle(`🌿 Created ${refType}: ${refName}`)
        .setURL(repoUrl)
        .setAuthor({ name: sender, iconURL: avatar })
        .addFields({ name: 'Repository', value: repoName, inline: true })
        .setTimestamp();
    }

    if (eventType === 'delete') {
      const refType = payload.ref_type;
      const refName = payload.ref;
      return new EmbedBuilder()
        .setColor(Colors.BranchDelete)
        .setTitle(`🗑 Deleted ${refType}: ${refName}`)
        .setURL(repoUrl)
        .setAuthor({ name: sender, iconURL: avatar })
        .addFields({ name: 'Repository', value: repoName, inline: true })
        .setTimestamp();
    }

    if (eventType === 'fork') {
      const forkRepo = payload.forkee?.full_name || 'Fork';
      return new EmbedBuilder()
        .setColor(Colors.Fork)
        .setTitle(`🍴 Repository Forked`)
        .setURL(payload.forkee?.html_url || repoUrl)
        .setAuthor({ name: sender, iconURL: avatar })
        .setDescription(`Forked [${repoName}](${repoUrl}) -> [${forkRepo}](${payload.forkee?.html_url})`)
        .setTimestamp();
    }

    if (eventType === 'watch') {
      const stars = payload.repository?.stargazers_count || 0;
      return new EmbedBuilder()
        .setColor(Colors.Star)
        .setTitle(`⭐ Repository Starred`)
        .setURL(repoUrl)
        .setAuthor({ name: sender, iconURL: avatar })
        .setDescription(`[${repoName}](${repoUrl}) now has **${stars}** star(s)!`)
        .setTimestamp();
    }

    // Default Fallback Embed
    return new EmbedBuilder()
      .setColor(Colors.Default)
      .setTitle(`🔔 GitHub Event: ${eventType}`)
      .setURL(repoUrl)
      .setAuthor({ name: sender, iconURL: avatar })
      .addFields({ name: 'Repository', value: repoName, inline: true })
      .setTimestamp();
  }
}
