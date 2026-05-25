interface BrokenDayCardProps {
  day: number;
  failedTrackIds: number[];
}

const UPSTREAM_REPO = 'audio-connections/audio-connections';

/** Builds a pre-filled GitHub Issues URL the player can click to report
 *  the broken day. Title encodes the day; body lists the dead iTunes IDs
 *  so a maintainer can fix without a player having to type anything. */
function buildIssueUrl(day: number, failedTrackIds: number[]): string {
  const title = `Day ${day}: missing iTunes ID`;
  const body = [
    `Day ${day} won't load — one or more iTunes IDs no longer resolve.`,
    '',
    'Failed iTunes track IDs:',
    ...failedTrackIds.map((id) => `- ${id}`),
  ].join('\n');
  const params = new URLSearchParams({ title, body });
  return `https://github.com/${UPSTREAM_REPO}/issues/new?${params.toString()}`;
}

export function BrokenDayCard({ day, failedTrackIds }: BrokenDayCardProps) {
  const issueUrl = buildIssueUrl(day, failedTrackIds);

  return (
    <div className="end-panel broken-day-card" data-testid="broken-day-card">
      <div className="end-watermark" aria-hidden="true">
        Dropout
      </div>
      <div className="end-jcard-header">
        <span>Audio Connections · Quality Control</span>
        <span>NO. {String(day).padStart(3, '0')}</span>
      </div>
      <div className="end-stamp">Tape Fault</div>
      <h2>Tape Damaged.</h2>
      <p className="end-subhead">Day {day} can't be played right now</p>
      <p className="broken-body">
        One or more tracks in this puzzle aren't available from iTunes
        anymore. The puzzle won't work until a maintainer swaps in fresh
        track IDs.
      </p>
      <p className="broken-pickprompt">↑ Pick a different day from the picker above.</p>
      <a
        className="broken-report-btn"
        href={issueUrl}
        target="_blank"
        rel="noreferrer noopener"
        data-testid="broken-report-btn"
      >
        Report this puzzle
      </a>
    </div>
  );
}
