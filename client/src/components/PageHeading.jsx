/**
 * The registry rule (design.md §5): a 3px registry-green rule anchoring the
 * page's primary heading. Once per section, not on every card.
 *
 * @param {string} title
 * @param {string} [description]
 * @param {React.ReactNode} [actions]
 */
const PageHeading = ({ title, description, actions }) => (
  <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div className="border-s-[3px] border-registry-green ps-4">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-prose text-sm text-text-secondary">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </header>
);

export default PageHeading;
