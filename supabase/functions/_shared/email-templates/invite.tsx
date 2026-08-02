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
  Link,
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
  link,
  logo,
  main,
  tagline,
  text,
  verse,
} from './brand.ts'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You&apos;ve been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="72" height="72" alt={siteName} style={logo} />
        <Text style={tagline}>{TAGLINE}</Text>
        <Section style={card}>
          <Heading style={h1}>You&apos;ve been invited</Heading>
          <Text style={text}>
            Someone invited you to join{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            , a faith-centered community for intentional relationships.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Accept the invitation
          </Button>
          <Text style={verse}>
            &ldquo;Encourage one another and build each other up.&rdquo; — 1 Thessalonians
            5:11
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you weren&apos;t expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
