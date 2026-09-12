/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import { MentorInviteEmail } from '../email-templates/mentor-invite.tsx'
import type { TemplateEntry } from './registry.ts'

interface MentorInviteProps {
  siteName?: string
  inviterName?: string
  note?: string | null
  inviteUrl?: string
}

const MentorInvite = ({
  siteName = 'TrueYoke',
  inviterName = 'A TrueYoke member',
  note = null,
  inviteUrl = 'https://trueyoke.app/invite/mentor',
}: MentorInviteProps) =>
  React.createElement(MentorInviteEmail, { siteName, inviterName, note, inviteUrl })

export const template = {
  component: MentorInvite,
  displayName: 'Mentor invitation',
  subject: (data: Record<string, any>) =>
    `${data.inviterName ?? 'A TrueYoke member'} invited you to be their TrueYoke mentor`,
  previewData: {
    siteName: 'TrueYoke',
    inviterName: 'Grace Adeyemi',
    note: 'You have walked with me for years — would you stand with me here too?',
    inviteUrl: 'https://trueyoke.app/invite/mentor?token=sample-token',
  },
} satisfies TemplateEntry
