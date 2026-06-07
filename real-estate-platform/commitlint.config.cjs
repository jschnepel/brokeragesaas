/**
 * Conventional Commits enforcement for RLSIR.
 * Per docs/superpowers/plans/2026-05-04-execution-playbook.md Section 2.0
 * standing gates and the Phase A commit pattern.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Subject line max length 100 (a touch more lenient than the 72 default
    // since some scopes are necessarily verbose, e.g., feat(lambda): ARMLS...)
    'header-max-length': [2, 'always', 100],

    // Allowed types — same set used in the Phase A commits
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test',
      ],
    ],

    // Subject case: free-form (not strictly lowercase) so we can keep
    // proper-noun usage like "ARMLS" or "DuckDB" in commit subjects.
    'subject-case': [0],
  },
};
