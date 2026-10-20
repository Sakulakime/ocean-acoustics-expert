# Release publishing

Every published GitHub Release must synchronize its matching package version to the official npm registry. A release is complete only after the GitHub Actions publish job and registry verification succeed.

## Normal release

1. Update `package.json`, relevant documentation and release notes. Run `npm test`, `npm run check` and the package-content checks before committing.
2. Tag the tested commit as `v<package.json version>` and push the commit and tag. Publish the GitHub Release for that exact tag.
3. `.github/workflows/publish-npm.yml` handles the `release.published` event. It checks out the exact tag, validates the version, tests the release source, checks the tarball, and publishes through npm Trusted Publishing (OIDC).
4. Verify the workflow result and the official registry's version, artifact integrity and distribution tag. Do not describe a GitHub-only publication as a completed release.

Stable releases use `latest`; prereleases use `next`. Publishing an older version preserves a newer `latest` or `next` by using `backport` for that publication. A rerun does not republish an immutable version: it verifies that the existing artifact matches, then checks the distribution tag. Registry and authentication errors fail the job rather than being treated as an unpublished version.

Publication is serialized with GitHub's `concurrency.queue: max` so separate releases do not replace a single pending run or race to update distribution tags. GitHub allows up to 100 pending entries in this queue; monitor failed or cancelled workflow runs and retry them with the manual dispatch below.

The tarball must contain the book-selection policy and four topic notes and must exclude PDFs, credentials, machine-specific paths and local working files. Book PDFs remain user-supplied (ADR 0006).

## One-time trusted publisher setup

The npm package maintainer authorizes exactly this GitHub publisher:

| Field | Value |
|---|---|
| Package | `ocean-acoustics-expert` |
| GitHub owner | `Sakulakime` |
| Repository | `ocean-acoustics-expert` |
| Workflow filename | `publish-npm.yml` |
| GitHub environment | None |
| Allowed operation | Direct `npm publish` |

With npm CLI 11.15.0 or later, an authenticated maintainer with account 2FA can configure it using:

```sh
npm trust github ocean-acoustics-expert \
  --file publish-npm.yml \
  --repo Sakulakime/ocean-acoustics-expert \
  --allow-publish --yes \
  --registry=https://registry.npmjs.org
```

No npm token is stored in GitHub secrets. The workflow uses GitHub-hosted runners, Node.js 24, npm 11.21.0, `contents: read` and `id-token: write`. OIDC publication also supplies provenance for this public repository/package. Configure and complete the first real publish within npm's two-day validation window; a skipped already-published version does not validate a new publisher.

Local authentication and trust commands must target `https://registry.npmjs.org`, even when the machine uses a download mirror by default. Do not change global registry or proxy settings just to publish.

## Retry or synchronize an existing release

Run the same workflow against an existing, non-draft GitHub release:

```sh
gh workflow run publish-npm.yml --ref main -f tag=v0.2.0 -f dry_run=false
gh run list --workflow publish-npm.yml
```

This supports old release tags such as `v0.2.0` that predate the workflow and satisfy the current package-content checks: automation tools are loaded from the workflow's own commit, separately from the release package source. A mismatch between the release tag and `package.json` fails before publishing. An existing version with a different integrity hash is a failure, not permission to overwrite it.

If a version exists but its expected distribution tag is behind, investigate and repair the tag with an authorized maintainer; the workflow does not request separate OIDC dist-tag management privileges. Never unpublish a version to make a rerun work.

Manual dispatch defaults to validation without publication. Use `-f dry_run=true` to exercise release lookup, source tests, packaging and registry checks before trusted-publisher authorization is available. A green dry run does not prove that npm publish authorization works. The `release.published` event always performs the real publish path.

## References

- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
- [GitHub Release events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release)
