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
} from './brand.ts'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail to read
  // "from OLD to NEW" instead of "from NEW to NEW".
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="72" height="72" alt={siteName} style={logo} />
        <Text style={tagline}>{TAGLINE}</Text>
        <Section style={card}>
          <Heading style={h1}>Confirm your email change</Heading>
          <Text style={text}>
            You asked to change the email on your {siteName} account from{' '}
            <strong>{oldEmail}</strong> to <strong>{newEmail}</strong>.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirm the change
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn&apos;t request this change, please secure your account right away.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
