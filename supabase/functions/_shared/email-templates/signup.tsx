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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to begin on {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="72" height="72" alt={siteName} style={logo} />
        <Text style={tagline}>{TAGLINE}</Text>
        <Section style={card}>
          <Heading style={h1}>Confirm your email</Heading>
          <Text style={text}>
            Welcome to{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>{' '}
            — a place for faithful, intentional relationships.
          </Text>
          <Text style={text}>
            Confirm <strong>{recipient}</strong> to finish setting up your account:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirm my email
          </Button>
          <Text style={verse}>
            &ldquo;Two are better than one, because they have a good reward for their
            labor.&rdquo; — Ecclesiastes 4:9
          </Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn&apos;t create a {siteName} account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
