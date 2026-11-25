'use client';

import { useMemo } from 'react';
import VerdictExperience from '../../src/components/verdict/VerdictExperience';
import AssistantDoor from '../../src/components/verdict/AssistantDoor';
import SketchDoor from '../../src/components/verdict/SketchDoor';
import { browserDay } from '../../src/lib/verdict/localTime';
import { getVisitorId, trackEvent } from '../../src/lib/trackEvent';

export default function VerdictPage() {
  const day = useMemo(() => browserDay(), []);
  return (
    <VerdictExperience
      doors={(score) => (
        <>
          <AssistantDoor
            date={day.date}
            timezone={day.timezone}
            onDay={(input) => score(input, 'assistant')}
            onCopy={(assistant) =>
              trackEvent('verdict_prompt_copied', { assistant }, getVisitorId())
            }
            onError={() => trackEvent('verdict_paste_failed', {}, getVisitorId())}
          />
          <SketchDoor
            date={day.date}
            timezone={day.timezone}
            onDay={(input) => score(input, 'sketch')}
          />
        </>
      )}
    />
  );
}
