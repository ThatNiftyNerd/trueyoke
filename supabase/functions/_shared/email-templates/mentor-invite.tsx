/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import {
  LOGO_URL,
  TAGLINE,
  button,
  card,
  container,
  footer,
  h1,
  hr,
  logo,
  main,
  tagline,
  text,
  verse,
} from './brand.ts'

interface MentorInviteEmailProps {
  siteName: string
  inviterName: string
  note: string | null
  inviteUrl: string
}

export const MentorInviteEmail = ({
  siteName,
  inviterName,
  note,
  inviteUrl,
}: MentorInviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{inviterName} invited you to be their mentor on {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="72" height="72" alt={siteName} style={logo} />
        <Text style={tagline}>{TAGLINE}</Text>
        <Section style={card}>
          <Heading style={h1}>You&apos;ve been invited to mentor</Heading>
          <Text style={text}>
            <strong>{inviterName}</strong> is looking for a trusted mentor to walk alongside them
            on <strong>{siteName}</strong>, a place for faithful, intentional relationships, and
            they&apos;d be honored if that mentor were you.
          </Text>
          {note ? (
            <Text style={text}>
              Their note to you: <em>&ldquo;{note}&rdquo;</em>
            </Text>
          ) : null}
          <Text style={text}>
            Accepting takes a couple of minutes: create a free Mentor account, and{' '}
            {inviterName}&apos;s request will be waiting for you.
          </Text>
          <Button style={button} href={inviteUrl}>
            Accept the invitation
          </Button>
          <Text style={verse}>
            &ldquo;Two are better than one, because they have a good reward for their
            labor.&rdquo; (Ecclesiastes 4:9)
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you weren&apos;t expecting this, you can safely ignore this email. This invite link
          expires in 14 days.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MentorInviteEmail
