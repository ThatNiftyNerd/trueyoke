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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your {siteName} password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="72" height="72" alt={siteName} style={logo} />
        <Text style={tagline}>{TAGLINE}</Text>
        <Section style={card}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset the password for your {siteName} account.
            Choose a new one below.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Choose a new password
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn&apos;t request this, you can safely ignore this email — your password
          won&apos;t change.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
