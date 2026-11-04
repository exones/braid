// Offline relative-link and heading-anchor check.
// repository: false keeps hosted and other external URLs out of the gate.
// inspiration/ is ignored even when a tracked file links into it.
export default {
  plugins: [
    [
      'remark-validate-links',
      {
        repository: false,
        skipPathPatterns: ['[/\\\\]inspiration(?:[/\\\\]|$)'],
      },
    ],
  ],
}
