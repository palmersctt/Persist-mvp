'use client';

import { useMemo } from 'react';
import VerdictExperience from '../../src/components/verdict/VerdictExperience';
import AssistantDoor from '../../src/components/verdict/AssistantDoor';
import { browserDay } from '../../src/lib/verdict/localTime';

export default function VerdictPage() {
  const day = useMemo(() => browserDay(), []);
  return (
    <VerdictExperience
      doors={(score) => <AssistantDoor date={day.date} timezone={day.timezone} onDay={score} />}
    />
  );
}
