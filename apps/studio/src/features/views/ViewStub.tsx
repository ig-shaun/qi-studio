"use client";

type Props = {
  title: string;
};

export function ViewStub({ title }: Props) {
  return (
    <div className="canvas-empty">
      <div className="canvas-empty__card">
        <div className="eyebrow">Coming soon</div>
        <h3 className="canvas-empty__title">{title}</h3>
        <p className="canvas-empty__body">
          This view lands in a follow-up pass. The Organism view is the v1
          hero — the rest of the nav is wired up as placeholders so the app
          shell is complete end-to-end.
        </p>
      </div>
    </div>
  );
}
